import type { Metadata } from "next";
import FeaturesPageClient from "@/app/features/features-page-client";

const SITE_URL = "https://www.nuvare.app";

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Nuvare",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  url: `${SITE_URL}/features`,
  description:
    "Nuvare gives internationally mobile professionals one place to track deadlines, ask cross-border questions, and organize compliance documents.",
};

export const metadata: Metadata = {
  title: "Features | Nuvare",
  description:
    "Explore Nuvare features: deadline dashboard, cross-border Q&A, document vault, and country intelligence for globally mobile professionals.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features | Nuvare",
    description:
      "Explore Nuvare features: deadline dashboard, cross-border Q&A, document vault, and country intelligence.",
    url: `${SITE_URL}/features`,
    siteName: "Nuvare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features | Nuvare",
    description:
      "Explore Nuvare features: deadline dashboard, cross-border Q&A, document vault, and country intelligence.",
  },
};

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <FeaturesPageClient />
    </>
  );
}
