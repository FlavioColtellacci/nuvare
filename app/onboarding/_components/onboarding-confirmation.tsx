export function OnboardingConfirmation() {
  return (
    <section className="question-fade-in flex flex-1 items-center justify-center">
      <div className="space-y-6 text-center">
        <div className="mx-auto h-2 w-2 animate-pulse rounded-full bg-white/70" />
        <h2 className="font-editorial text-3xl text-white sm:text-4xl md:text-5xl">
          Your intelligence layer is being built
        </h2>
        <p className="text-sm text-white/55">
          Preparing your global profile and routing you to your dashboard.
        </p>
      </div>
    </section>
  );
}
