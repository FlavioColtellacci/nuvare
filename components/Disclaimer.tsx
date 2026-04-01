import Link from "next/link";

export default function Disclaimer() {
  return (
    <div className="w-full text-center py-6">
      <p className="text-xs text-white/30">
        This is informational only, not legal or financial advice.
      </p>
      <p className="mt-2 text-xs text-white/40">
        <Link
          href="/intelligence-methodology"
          className="underline decoration-white/40 underline-offset-4 transition-colors hover:text-white/70"
        >
          Learn how Nuvare intelligence works
        </Link>
      </p>
    </div>
  );
}
