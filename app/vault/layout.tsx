import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault | Nuvare",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
    },
  },
};

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
