import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type DeadlineItem = {
  title: string;
  due_date: string;
  urgency: "urgent" | "upcoming" | "clear";
};

type DeadlineReminderEmailProps = {
  userName: string;
  deadlines: DeadlineItem[];
};

const URGENCY_STYLES: Record<DeadlineItem["urgency"], { label: string; bg: string; text: string }> = {
  urgent: { label: "Urgent", bg: "#FEE2E2", text: "#991B1B" },
  upcoming: { label: "Upcoming", bg: "#FEF3C7", text: "#92400E" },
  clear: { label: "Planned", bg: "#DCFCE7", text: "#166534" },
};

function formatDueDate(dateValue: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? `${dateValue}T00:00:00.000Z`
    : dateValue;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function DeadlineReminderEmail({ userName, deadlines }: DeadlineReminderEmailProps) {
  const deadlineCount = deadlines.length;
  const heading = `You have ${deadlineCount} upcoming deadline${deadlineCount === 1 ? "" : "s"}`;

  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>NUVARE</Text>
          <Heading style={styles.heading}>{heading}</Heading>
          <Text style={styles.subheading}>Here&apos;s what needs your attention</Text>
          <Text style={styles.greeting}>Hi {userName},</Text>

          {deadlines.map((deadline) => {
            const urgency = URGENCY_STYLES[deadline.urgency];

            return (
              <Section key={`${deadline.title}-${deadline.due_date}`} style={styles.card}>
                <Text style={styles.cardTitle}>{deadline.title}</Text>
                <Text style={styles.cardDate}>Due: {formatDueDate(deadline.due_date)}</Text>
                <Text
                  style={{
                    ...styles.badge,
                    backgroundColor: urgency.bg,
                    color: urgency.text,
                  }}
                >
                  {urgency.label}
                </Text>
              </Section>
            );
          })}

          <Section style={styles.ctaWrap}>
            <Button href="https://nuvare.vercel.app/dashboard" style={styles.button}>
              View Your Deadlines
            </Button>
          </Section>

          <Text style={styles.footer}>
            Nuvare · This is informational only, not legal or financial advice. · Unsubscribe
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#F6F7F9",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: 0,
    padding: "24px 12px",
  },
  container: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "600px",
    padding: "28px",
  },
  brand: {
    color: "#111827",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    margin: "0 0 18px",
    textTransform: "uppercase" as const,
  },
  heading: {
    color: "#111827",
    fontSize: "26px",
    fontWeight: "700",
    letterSpacing: "-0.01em",
    lineHeight: "1.2",
    margin: "0 0 8px",
  },
  subheading: {
    color: "#4B5563",
    fontSize: "15px",
    lineHeight: "1.5",
    margin: "0 0 20px",
  },
  greeting: {
    color: "#374151",
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0 0 14px",
  },
  card: {
    backgroundColor: "#FAFAFA",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    marginBottom: "12px",
    padding: "14px",
  },
  cardTitle: {
    color: "#111827",
    fontSize: "15px",
    fontWeight: "700",
    lineHeight: "1.4",
    margin: "0 0 6px",
  },
  cardDate: {
    color: "#374151",
    fontSize: "14px",
    lineHeight: "1.4",
    margin: "0 0 10px",
  },
  badge: {
    borderRadius: "9999px",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1",
    margin: "0",
    padding: "6px 10px",
  },
  ctaWrap: {
    marginTop: "18px",
    marginBottom: "14px",
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "700",
    padding: "12px 18px",
    textDecoration: "none",
  },
  footer: {
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: "1.5",
    marginTop: "18px",
    textAlign: "center" as const,
  },
};

export default DeadlineReminderEmail;
