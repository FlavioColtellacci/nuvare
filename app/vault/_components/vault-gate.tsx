import Link from "next/link";

export function VaultLoadingShell() {
  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black text-white">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative flex min-h-screen items-center justify-center">
        <p className="text-sm text-white/60">Loading vault...</p>
      </div>
    </main>
  );
}

export function VaultProfessionalUpsell() {
  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black px-6 text-white">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center">
        <section className="w-full rounded-2xl border border-white/20 bg-[#0a0a0a]/90 p-8 text-center">
          <h1 className="font-editorial text-5xl text-white">Document Vault</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60">
            Securely store your passports, visas, and compliance documents. Available on the
            Professional plan.
          </p>
          <Link
            href="/pricing"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Upgrade to Professional →
          </Link>
        </section>
      </div>
    </main>
  );
}
