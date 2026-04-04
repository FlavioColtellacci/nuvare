import type { Metadata } from "next";
import PricingClient from "@/app/pricing/pricing-client";
import BackButton from "@/components/BackButton";

const SITE_URL = "https://www.nuvare.app";

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Nuvare",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  url: `${SITE_URL}/pricing`,
  description:
    "Nuvare pricing for internationally mobile professionals who need proactive cross-border compliance intelligence.",
  offers: [
    {
      "@type": "Offer",
      name: "Core",
      priceCurrency: "USD",
      price: "99",
      url: `${SITE_URL}/pricing`,
    },
    {
      "@type": "Offer",
      name: "Professional",
      priceCurrency: "USD",
      price: "199",
      url: `${SITE_URL}/pricing`,
    },
  ],
};

export const metadata: Metadata = {
  title: "Pricing | Nuvare",
  description:
    "See Nuvare pricing plans for cross-border tax, visa, and compliance intelligence. Choose Core or Professional based on your needs.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | Nuvare",
    description:
      "Compare Nuvare pricing plans for cross-border tax, visa, and compliance intelligence.",
    url: `${SITE_URL}/pricing`,
    siteName: "Nuvare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Nuvare",
    description:
      "Compare Nuvare pricing plans for cross-border tax, visa, and compliance intelligence.",
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <div className="relative">
        <div className="absolute top-6 left-6 z-50">
          <BackButton />
        </div>
        <PricingClient
          coreMonthlyPriceId={process.env.STRIPE_CORE_MONTHLY_PRICE_ID ?? ""}
          coreYearlyPriceId={process.env.STRIPE_CORE_YEARLY_PRICE_ID ?? ""}
          professionalMonthlyPriceId={process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID ?? ""}
          professionalYearlyPriceId={process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID ?? ""}
        />
      </div>
    </>
  );
}
