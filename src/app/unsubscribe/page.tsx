import type { Metadata } from "next";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Unsubscribe from the CVRD Daily Pick newsletter.",
  alternates: { canonical: "/unsubscribe" },
  robots: { index: false },
};

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <div className="min-h-screen py-16 px-6 flex items-center justify-center" style={{ background: '#1e2a3a' }}>
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <a href="/" aria-label="CVRD News home">
            <img src="/logo3.png" alt="CVRD News" className="h-20 mx-auto mb-4 opacity-90" />
          </a>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Unsubscribe
          </h1>
        </div>
        <div className="bg-white rounded-lg p-8 text-[15px] text-[#333] leading-[1.7]">
          <UnsubscribeForm initialEmail={email ?? ""} />
        </div>
      </div>
    </div>
  );
}
