import type { Metadata } from "next";
import LandingPageClient from "@/app/landing-page-client";

const SITE_URL = "https://www.nuvare.app";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nuvare",
  url: SITE_URL,
  logo: `${SITE_URL}/nuvare_favicon.png`,
  description:
    "Nuvare helps internationally mobile professionals stay ahead of cross-border tax, visa, and compliance obligations.",
  sameAs: [SITE_URL],
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Nuvare",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Private compliance and financial intelligence for internationally mobile professionals.",
  offers: [
    {
      "@type": "Offer",
      name: "Core",
      price: "99",
      priceCurrency: "USD",
      url: `${SITE_URL}/pricing`,
    },
    {
      "@type": "Offer",
      name: "Professional",
      price: "199",
      priceCurrency: "USD",
      url: `${SITE_URL}/pricing`,
    },
  ],
};

export const metadata: Metadata = {
  title: "Nuvare | Cross-Border Compliance Intelligence",
  description:
    "Nuvare helps internationally mobile professionals track cross-border tax, visa, and compliance obligations with clear, private intelligence.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nuvare | Cross-Border Compliance Intelligence",
    description:
      "Track cross-border tax, visa, and compliance obligations with private intelligence built for internationally mobile professionals.",
    url: SITE_URL,
    siteName: "Nuvare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuvare | Cross-Border Compliance Intelligence",
    description:
      "Track cross-border tax, visa, and compliance obligations with private intelligence built for internationally mobile professionals.",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <LandingPageClient />
    </>
  );
}
