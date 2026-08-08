import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About CVRD News",
  description: "CVRD News is an AI-powered daily news intelligence platform that exposes the narrative gaps between mainstream media and the unfiltered internet — covering every story from every angle.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: '#1e2a3a' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <a href="/" aria-label="CVRD News home">
            <img src="/logo3.png" alt="CVRD News" className="h-24 mx-auto mb-6 opacity-90" />
          </a>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            About CVRD News
          </h1>
          <p className="text-[#aaa] text-[15px]">Watch it. Read it. Check it.</p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-lg p-8 md:p-12 space-y-8 text-[15px] text-[#333] leading-[1.75]">

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>What is CVRD News?</h2>
            <p>
              CVRD News is an independent news intelligence platform built to show you every side of every story. We monitor over 36 news sources across the political spectrum — from mainstream broadcasters and national newspapers to X posts, YouTube commentary, and Telegram channels — and surface the gaps that individual outlets leave behind.
            </p>
            <p className="mt-3">
              Every day, CVRD News produces a structured briefing on the top stories that matter: what the left is saying, what the right is saying, and what neither side is telling you. We do not take political sides. We surface all of them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>The Narrative Gap</h2>
            <p>
              Every major news event generates multiple competing narratives. A story covered enthusiastically by one side of the media is often buried or reframed by the other. Social media surfaces a third version that mainstream outlets ignore entirely. These differences — the gaps between what is reported, how it is reported, and what is left out — are what CVRD News is designed to expose.
            </p>
            <p className="mt-3">
              We call this the <strong>narrative gap</strong>. Finding it, naming it, and presenting all perspectives side by side is the core purpose of every story we publish.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>How It Works</h2>
            <p>
              Each day, our intelligence pipeline ingests data from a curated set of sources across five categories: World, Politics, Markets, Trending, and Sports. Sources include major RSS feeds from left-leaning, right-leaning, and centrist outlets, as well as signals from X/Twitter, YouTube, Telegram, and Google Trends.
            </p>
            <p className="mt-3">
              This raw data is analyzed to detect the stories generating the most divergent coverage — where mainstream outlets and unfiltered social channels tell fundamentally different stories. The output is a daily briefing of the 10 most significant narrative gaps, each with sourced left and right perspectives and an editorial note on what is missing from both.
            </p>
            <p className="mt-3">
              The same stories power our daily video show, short-form content published to YouTube, Instagram, and TikTok, and our interactive website sections including <strong>On Record</strong> (politician fact-tracking) and <strong>Timeline</strong> (long-running story threads).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>On Record</h2>
            <p>
              On Record is CVRD's politician accountability section. We systematically track the public statements, tweets, and voting records of elected officials and public figures, rating each claim as True, Misleading, or False. Scores are aggregated across domains — healthcare, economy, foreign policy, and more — to build a running record of each politician's accuracy over time.
            </p>
            <p className="mt-3">
              On Record reports are published as structured video briefings hosted by Judge Zero, presented in a courtroom format designed to hold public figures accountable with evidence, not opinion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Editorial Standards</h2>
            <p>
              CVRD News does not have a political affiliation. We do not endorse candidates, parties, or ideological positions. Our role is to present verified information from identifiable sources and to surface the differences in how that information is framed across the media landscape.
            </p>
            <p className="mt-3">
              All claims rated in On Record are drawn from verifiable public records — tweets, official statements, voting records, and press transcripts. AI-assisted analysis is used to organise and surface data; editorial judgment is applied to ensure accuracy and fairness. We do not fabricate, speculate, or attribute claims without a source.
            </p>
            <p className="mt-3">
              Where our analysis is uncertain or incomplete, we say so. Where a narrative only exists on one side of the spectrum and not the other, we report it that way rather than invent a counterpart.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Who We Are</h2>
            <p>
              CVRD News is built and operated by <strong>Andlane</strong>, an independent automation and technology studio based in London, UK. Andlane builds products at the intersection of artificial intelligence and real-world information problems. CVRD News is our public-facing answer to the question of whether AI can make journalism more transparent, not replace it.
            </p>
            <p className="mt-3">
              We are independent, self-funded, and not affiliated with any media group, political organisation, or advertising partner. Revenue from advertising goes toward platform costs and development.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Contact</h2>
            <p>
              For press enquiries, corrections, or general questions, contact us at{" "}
              <a href="mailto:info@cvrdnews.com" className="text-blue-600 underline">info@cvrdnews.com</a>.
            </p>
            <p className="mt-3">
              If you believe a claim rated in On Record is factually incorrect or sourced inaccurately, please email us with the specific claim and supporting evidence. We review all corrections and update our records where warranted.
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4">
            <a href="/" className="text-[12px] text-[#888] hover:text-white transition-colors">Home</a>
            <span className="text-[#555]">·</span>
            <a href="/privacy" className="text-[12px] text-[#888] hover:text-white transition-colors">Privacy Policy</a>
            <span className="text-[#555]">·</span>
            <a href="/terms" className="text-[12px] text-[#888] hover:text-white transition-colors">Terms of Service</a>
            <span className="text-[#555]">·</span>
            <a href="/affiliate-disclosure" className="text-[12px] text-[#888] hover:text-white transition-colors">Affiliate Disclosure</a>
            <span className="text-[#555]">·</span>
            <a href="/contact" className="text-[12px] text-[#888] hover:text-white transition-colors">Contact</a>
          </div>
        </div>

      </div>
    </div>
  );
}
