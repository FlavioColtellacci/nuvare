// IMPORTANT: Add CRON_SECRET to Vercel environment variables — any random string,
// e.g. generate one at: https://generate-secret.vercel.app/32
// Also add RESEND_API_KEY if not already present.
import { NextResponse } from "next/server";
import React from "react";
import { render } from "@react-email/render";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from "resend";

import { DeadlineReminderEmail } from "@/lib/emails/DeadlineReminderEmail";

export const runtime = "nodejs";

type DeadlineRow = {
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
const TARGET_DAY_OFFSETS = [90, 30, 7] as const;
const TARGET_DAY_TOLERANCE = 1;

function dateOnlyToUtcMidnight(dateValue: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(`${dateValue}T00:00:00.000Z`)
    : new Date(dateValue);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getDaysUntil(dueDate: string, todayUtc: Date) {
  const due = dateOnlyToUtcMidnight(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  return Math.round((due.getTime() - todayUtc.getTime()) / DAY_IN_MS);
}

function qualifiesForReminder(dayOffset: number) {
  return TARGET_DAY_OFFSETS.some((target) => Math.abs(dayOffset - target) <= TARGET_DAY_TOLERANCE);
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
  supabase: SupabaseClient<any, any, any>,
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

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const resend = new Resend(resendApiKey);

  let sent = 0;
  let errors = 0;

  try {
    const todayUtc = startOfUtcDay(new Date());
    const endUtc = new Date(todayUtc.getTime() + 90 * DAY_IN_MS);
    const minDate = toIsoDate(todayUtc);
    const maxDate = toIsoDate(endUtc);

    const { data: deadlinesData, error: deadlinesError } = await supabaseAdmin
      .from("deadlines")
      .select("user_id,title,due_date")
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

    for (const [userId, userDeadlines] of deadlinesByUser.entries()) {
      const recipientEmail = userEmails.get(userId);
      if (!recipientEmail) {
        continue;
      }

      const qualifyingDeadlines: DeadlineEmailItem[] = userDeadlines
        .map((deadline) => {
          const daysUntil = getDaysUntil(deadline.due_date, todayUtc);
          if (daysUntil === null || !qualifiesForReminder(daysUntil)) {
            return null;
          }

          return {
            title: deadline.title,
            due_date: deadline.due_date,
            urgency: mapUrgency(daysUntil),
          };
        })
        .filter((item): item is DeadlineEmailItem => item !== null);

      if (qualifyingDeadlines.length === 0) {
        continue;
      }

      try {
        const html = await render(
          React.createElement(DeadlineReminderEmail, {
            userName: recipientEmail.split("@")[0] ?? "there",
            deadlines: qualifyingDeadlines,
          }),
        );

        const { error: sendError } = await resend.emails.send({
          from: "Nuvare <reminders@nuvare.vercel.app>",
          to: recipientEmail,
          subject: "Upcoming deadline reminder from Nuvare",
          html,
        });

        if (sendError) {
          errors += 1;
        } else {
          sent += 1;
        }
      } catch {
        errors += 1;
      }
    }

    return NextResponse.json({ sent, errors });
  } catch {
    return NextResponse.json({ sent, errors: errors + 1 }, { status: 500 });
  }
}
