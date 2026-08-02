import type { Metadata } from "next";
import { NewsletterSignup } from "./NewsletterSignup";

export const metadata: Metadata = {
  title: "The Daily Pick — CVRD Newsletter",
  description: "One email a day: the biggest stories from every side, fact-check verdicts, politician truth scores, and the threads that moved. Free.",
  alternates: { canonical: "/newsletter" },
};

const FEATURES = [
  ["Every side of the day's top stories", "What the left, the center, and the right are each saying, side by side."],
  ["Fact-check verdicts", "Claims traced to primary sources and rated True, Somewhat True, Misleading, or False."],
  ["On Record truth scores", "How truthful the politicians in today's news have been, tracked over time."],
  ["The threads that moved", "Long-running stories updated today, plus what happened on this day last year and ten years ago."],
];

export default function NewsletterPage() {
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: '#1e2a3a' }}>
      <div className="max-w-2xl mx-auto">

        <div className="mb-10 text-center">
          <a href="/" aria-label="CVRD News home">
            <img src="/logo3.png" alt="CVRD News" className="h-24 mx-auto mb-6 opacity-90" />
          </a>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            The Daily Pick
          </h1>
          <p className="text-[#aaa] text-[15px]">The news, unfiltered — in one email a day. Free.</p>
        </div>

        <div className="bg-white rounded-lg p-8 md:p-12 text-[15px] text-[#333] leading-[1.75]">
          <NewsletterSignup />

          <div className="mt-10 space-y-6">
            {FEATURES.map(([title, blurb]) => (
              <div key={title}>
                <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{title}</h2>
                <p className="text-[#555]">{blurb}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-[13px] text-[#888]">
            Sent every morning. No spam, no selling your address, unsubscribe with one click. Read about our methodology on the <a href="/how-we-work" className="text-blue-600 underline">How We Work</a> page.
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4">
            <a href="/" className="text-[12px] text-[#888] hover:text-white transition-colors">Home</a>
            <span className="text-[#555]">·</span>
            <a href="/about" className="text-[12px] text-[#888] hover:text-white transition-colors">About</a>
            <span className="text-[#555]">·</span>
            <a href="/how-we-work" className="text-[12px] text-[#888] hover:text-white transition-colors">How We Work</a>
            <span className="text-[#555]">·</span>
            <a href="/contact" className="text-[12px] text-[#888] hover:text-white transition-colors">Contact</a>
          </div>
        </div>

      </div>
    </div>
  );
}
