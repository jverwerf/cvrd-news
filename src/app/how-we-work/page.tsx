import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How We Work — Fact-Check Methodology",
  description: "How CVRD News fact-checks the news: 36+ sources across the political spectrum, primary-source verdicts, coverage analysis, and an open corrections policy.",
  alternates: { canonical: "/how-we-work" },
};

export default function HowWeWork() {
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: '#1e2a3a' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <a href="/" aria-label="CVRD News home">
            <img src="/logo3.png" alt="CVRD News" className="h-24 mx-auto mb-6 opacity-90" />
          </a>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            How We Work
          </h1>
          <p className="text-[#aaa] text-[15px]">Our fact-check methodology, in plain language</p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-lg p-8 md:p-12 space-y-8 text-[15px] text-[#333] leading-[1.75]">

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Reading across the spectrum</h2>
            <p>
              CVRD News covers the day&apos;s biggest stories by reading across the political spectrum, not from inside one bubble. Every day our system pulls reporting from 36+ outlets across left, center and right, and builds each story from all sides of that coverage. No single outlet — including us — sees the whole picture; the spread of coverage does.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Where verdicts come from</h2>
            <p>
              When we fact-check a claim, we trace it to primary sources — official records, transcripts, and on-the-record statements — and compare how outlets across the spectrum reported it. Each claim gets one of four verdicts: <strong>True</strong>, <strong>Somewhat True</strong>, <strong>Misleading</strong>, or <strong>False</strong>, and every verdict shows its sources.
            </p>
            <p className="mt-3">
              The same standard applies everywhere a verdict appears: in our daily shows, in <a href="/onrecord" className="text-blue-600 underline">On Record</a> politician profiles, and in The Divide, our weekly look at how the left and right argued the biggest story.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Coverage analysis</h2>
            <p>
              For major stories we also measure the coverage itself: how many left, center and right outlets covered it, and how heavily. When one side ignores a story, we show that too. What gets covered — and what gets buried — is part of the story.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>How it&apos;s made</h2>
            <p>
              CVRD uses automated systems to gather and cross-reference reporting at a scale no small newsroom could, with editorial oversight of what gets published. We&apos;re transparent about that: the technology does the reading, the methodology decides the verdicts, and everything is sourced so you can check our work. We don&apos;t editorialize — we show you every side and let you decide.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Corrections</h2>
            <p>
              If we get something wrong, we fix it. Spotted an error in a story or a verdict? Email{" "}
              <a href="mailto:info@cvrdnews.com" className="text-blue-600 underline">info@cvrdnews.com</a> with the specific claim and your evidence, or use the{" "}
              <a href="/contact" className="text-blue-600 underline">contact page</a>. We review every report and update the record where warranted.
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4">
            <a href="/" className="text-[12px] text-[#888] hover:text-white transition-colors">Home</a>
            <span className="text-[#555]">·</span>
            <a href="/about" className="text-[12px] text-[#888] hover:text-white transition-colors">About</a>
            <span className="text-[#555]">·</span>
            <a href="/privacy" className="text-[12px] text-[#888] hover:text-white transition-colors">Privacy Policy</a>
            <span className="text-[#555]">·</span>
            <a href="/contact" className="text-[12px] text-[#888] hover:text-white transition-colors">Contact</a>
            <span className="text-[#555]">·</span>
            <a href="/affiliate-disclosure" className="text-[12px] text-[#888] hover:text-white transition-colors">Affiliate Disclosure</a>
          </div>
        </div>

      </div>
    </div>
  );
}
