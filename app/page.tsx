import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="space-y-4 text-center">
        <p className="text-sm text-white/60">Nuvare setup</p>
        <h1 className="font-editorial text-4xl">Welcome</h1>
        <Link
          href="/onboarding"
          className="inline-flex rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:border-white/55 hover:bg-white/10"
        >
          Start onboarding
        </Link>
      </div>
    </main>
  );
}
