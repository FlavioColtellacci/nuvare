import PricingClient from "@/app/pricing/pricing-client";

export default function PricingPage() {
  return (
    <PricingClient
      coreMonthlyPriceId={process.env.STRIPE_CORE_MONTHLY_PRICE_ID ?? ""}
      coreYearlyPriceId={process.env.STRIPE_CORE_YEARLY_PRICE_ID ?? ""}
      professionalMonthlyPriceId={process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID ?? ""}
      professionalYearlyPriceId={process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID ?? ""}
    />
  );
}
