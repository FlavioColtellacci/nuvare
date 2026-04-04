// IMPORTANT: Add CRON_SECRET to Vercel environment variables — any random string,
// e.g. generate one at: https://generate-secret.vercel.app/32
// Also add RESEND_API_KEY if not already present.
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

import type { Database } from "@/lib/database.types";
import { fetchOnboardingByUserId, fetchRecentMemoryByUserIds } from "@/lib/cron/batch-fetch";
import {
  buildProfileEmailSectionHtml,
  buildProfileInsightLines,
  profileInsightNotificationBody,
} from "@/lib/cron/profile-alerts";
import { logApiError, logApiEvent } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type DeadlineRow = {
  id: string;
  user_id: string;
  title: string;
  due_date: string;
};

type DeadlineEmailItem = {
  title: string;
  due_date: string;
  urgency: "urgent" | "upcoming" | "clear";
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function dateOnlyToUtcMidnight(dateValue: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(`${dateValue}T00:00:00.000Z`)
    : new Date(dateValue);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function getDaysUntil(dueDate: string, todayUtc: Date) {
  const due = dateOnlyToUtcMidnight(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  return Math.round((due.getTime() - todayUtc.getTime()) / DAY_IN_MS);
}

function mapUrgency(dayOffset: number): DeadlineEmailItem["urgency"] {
  if (dayOffset <= 7) return "urgent";
  if (dayOffset <= 30) return "upcoming";
  return "clear";
}

function groupDeadlinesByUser(deadlines: DeadlineRow[]) {
  const grouped = new Map<string, DeadlineRow[]>();
  for (const deadline of deadlines) {
    const existing = grouped.get(deadline.user_id) ?? [];
    existing.push(deadline);
    grouped.set(deadline.user_id, existing);
  }
  return grouped;
}

async function listAllAuthUsers(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, string>> {
  const userEmailMap = new Map<string, string>();
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }

    for (const user of data.users) {
      if (user.email) {
        userEmailMap.set(user.id, user.email);
      }
    }

    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  return userEmailMap;
}

export async function GET(request: Request) {
  try {
    logApiEvent("/api/cron/weekly-summary", "cron_start", {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY,
    });

    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (!cronSecret) {
      return NextResponse.json({ error: "Missing CRON_SECRET." }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      return NextResponse.json(
        { error: "Missing one or more required environment variables." },
        { status: 500 },
      );
    }

    const supabaseAdmin = createAdminClient();
    const resend = new Resend(resendApiKey);

    let sent = 0;
    let errors = 0;

    const todayUtc = startOfUtcDay(new Date());
    const endUtc = new Date(todayUtc.getTime() + 30 * DAY_IN_MS);
    const minDate = toIsoDate(todayUtc);
    const maxDate = toIsoDate(endUtc);

    const { data: deadlinesData, error: deadlinesError } = await supabaseAdmin
      .from("deadlines")
      .select("id,user_id,title,due_date")
      .gte("due_date", minDate)
      .lte("due_date", maxDate);

    if (deadlinesError) {
      throw new Error(deadlinesError.message);
    }

    const deadlines = (deadlinesData ?? []).filter(
      (item): item is DeadlineRow =>
        Boolean(item.user_id) && Boolean(item.title) && Boolean(item.due_date),
    );
    const deadlinesByUser = groupDeadlinesByUser(deadlines);
    const userEmails = await listAllAuthUsers(supabaseAdmin);
    const cronUserIds = [...deadlinesByUser.keys()];
    const onboardingByUser = await fetchOnboardingByUserId(supabaseAdmin, cronUserIds);
    const memoryByUser = await fetchRecentMemoryByUserIds(supabaseAdmin, cronUserIds, 2);

    let profileNotifications = 0;

    for (const [userId, userDeadlines] of deadlinesByUser.entries()) {
      const recipientEmail = userEmails.get(userId);
      if (!recipientEmail) {
        continue;
      }

      const upcomingDeadlines: DeadlineEmailItem[] = userDeadlines
        .map((deadline) => {
          const daysUntil = getDaysUntil(deadline.due_date, todayUtc);
          if (daysUntil === null || daysUntil < 0 || daysUntil > 30) {
            return null;
          }

          return {
            title: deadline.title,
            due_date: deadline.due_date,
            urgency: mapUrgency(daysUntil),
          };
        })
        .filter((item): item is DeadlineEmailItem => item !== null);

      if (upcomingDeadlines.length === 0) {
        continue;
      }

      const profileLines = buildProfileInsightLines(
        onboardingByUser.get(userId) ?? null,
        memoryByUser.get(userId) ?? [],
      );
      const profileSectionHtml = buildProfileEmailSectionHtml(profileLines);

      try {
        const urgencyColor = (urgency: string) =>
          urgency === "urgent" ? "#ef4444" : urgency === "upcoming" ? "#f59e0b" : "#22c55e";

        const deadlineRows = upcomingDeadlines
          .map(
            (d: { title: string; due_date: string; urgency: string }) => `
  <tr>
    <td style="padding:12px 0;border-bottom:1px solid #f0f0f0">
      <strong style="display:block;color:#111">${d.title}</strong>
      <span style="color:#666;font-size:14px">${new Date(d.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
      <span style="margin-left:8px;padding:2px 8px;border-radius:9999px;font-size:12px;background:${urgencyColor(d.urgency)}22;color:${urgencyColor(d.urgency)}">${d.urgency}</span>
    </td>
  </tr>
`,
          )
          .join("");

        const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:40px 0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:40px">
    <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#111;margin:0 0 32px">NUVARE</p>
    <h1 style="font-size:22px;color:#111;margin:0 0 8px">Your weekly summary</h1>
    <p style="color:#666;margin:0 0 24px">Deadlines in the next 30 days (for your review only—we do not file on your behalf).</p>
    ${profileSectionHtml}
    <table style="width:100%;border-collapse:collapse">${deadlineRows}</table>
    <a href="https://nuvare.vercel.app/dashboard" style="display:inline-block;margin-top:32px;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">View Your Deadlines</a>
    <p style="margin-top:40px;font-size:12px;color:#999">Nuvare · This is informational only, not legal or financial advice.</p>
  </div>
</body>
</html>`;

        const { error: sendError } = await resend.emails.send({
          from: "Nuvare <onboarding@resend.dev>",
          to: recipientEmail,
          subject: "Your Nuvare weekly summary",
          html: html,
        });

        if (sendError) {
          errors += 1;
        } else {
          sent += 1;
          if (profileLines.length > 0) {
            const { error: profileNotifError } = await supabaseAdmin.from("notifications").insert({
              user_id: userId,
              title: "Profile check-in (informational)",
              body: profileInsightNotificationBody(profileLines),
              type: "profile_check_in",
              read: false,
            });
            if (profileNotifError) {
              logApiError("/api/cron/weekly-summary", profileNotifError, {
                phase: "profile_notification_insert",
              });
            } else {
              profileNotifications += 1;
            }
          }
        }
      } catch (emailError) {
        logApiError("/api/cron/weekly-summary", emailError, { phase: "email_send" });
        errors++;
      }
    }

    return NextResponse.json({ sent, errors, profileNotifications });
  } catch (error) {
    logApiError("/api/cron/weekly-summary", error);
    return NextResponse.json(
      {
        error: true,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
