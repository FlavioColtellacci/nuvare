import PricingClient from "@/app/pricing/pricing-client";
import BackButton from "@/components/BackButton";

export default function PricingPage() {
  return (
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
  );
}
