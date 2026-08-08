export const metadata = {
  title: "Affiliate Disclosure",
  description: "How CVRD News uses affiliate links, and the firewall between them and our journalism.",
  alternates: { canonical: "/affiliate-disclosure" },
};

export default function AffiliateDisclosure() {
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: '#1e2a3a' }}>
      <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>CVRD News — Affiliate Disclosure</h1>
        <div className="space-y-4 text-[15px] text-[#333] leading-[1.7]">
          <p>Last updated: August 9, 2026</p>

          <p><strong>In short:</strong> some links on CVRD News are affiliate links. If you click one and buy something, we may earn a commission. It never costs you anything extra, and it never affects what we cover or how we fact-check it.</p>

          <h2 className="text-xl font-bold mt-6">1. What an affiliate link is</h2>
          <p>An affiliate link is a tracked link to an advertiser&apos;s website. If you click it and go on to buy something or sign up, the advertiser pays CVRD News a small commission. The price you pay is exactly the same as it would be if you had gone to that website directly.</p>

          <h2 className="text-xl font-bold mt-6">2. Where these links appear</h2>
          <p>Affiliate links on CVRD News only ever appear in clearly marked advertising placements &mdash; the sponsored tiles and banners that carry an <strong>&ldquo;AD&rdquo;</strong> or <strong>&ldquo;SPONSORED&rdquo;</strong> label.</p>
          <p>They do not appear anywhere in our journalism. Specifically, you will never find an affiliate link inside:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>a news story, summary, or headline</li>
            <li>an <strong>On Record</strong> claim, verdict, or source citation</li>
            <li>a <strong>Divide</strong> comparison or any left/centre/right framing</li>
            <li>a timeline entry or developing-story thread</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">3. Editorial independence</h2>
          <p>CVRD News is a fact-checking publication. That only works if you can trust that what we publish is not for sale, so:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Advertisers have no input into which stories we cover, how we frame them, or what a fact-check concludes.</li>
            <li>No advertiser sees our coverage before it is published, and none can request changes or removals.</li>
            <li>We do not accept payment to write, alter, soften, or suppress a story.</li>
            <li>Whether a company advertises with us has no bearing on how we report on that company. If an advertiser becomes the subject of a story, we cover it exactly as we would any other.</li>
            <li>Our editorial team does not select advertisers based on commission rates, and commercial performance is not a factor in editorial decisions.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">4. Who we work with</h2>
          <p>CVRD News participates in affiliate programmes through the <a href="https://www.awin.com" rel="nofollow noopener noreferrer" target="_blank" className="text-blue-600 underline">Awin</a> affiliate network. Advertising on CVRD News is operated by Andlane Ltd, a company registered in England and Wales.</p>
          <p>Advertisers shown to you may vary depending on the country you are browsing from and the subject of the page you are reading, so that the advertising you see is at least relevant to you.</p>

          <h2 className="text-xl font-bold mt-6">5. How affiliate links are marked</h2>
          <p>Every sponsored placement is visually labelled, and every outbound affiliate link carries the <code className="text-[13px] bg-[#f1f1f1] px-1 py-0.5 rounded">rel=&quot;sponsored&quot;</code> attribute in its HTML, in line with search-engine guidance for paid links.</p>

          <h2 className="text-xl font-bold mt-6">6. Why we do this at all</h2>
          <p>Fact-checking is slow and expensive, and CVRD News is free to read with no paywall. Advertising and affiliate commission help cover the cost of producing it. We would rather be upfront about that than pretend the work funds itself.</p>

          <h2 className="text-xl font-bold mt-6">7. Compliance</h2>
          <p>This disclosure is provided in line with the U.S. Federal Trade Commission&apos;s <em>Guides Concerning the Use of Endorsements and Testimonials in Advertising</em> and the UK Competition and Markets Authority&apos;s guidance on clearly identifying advertising.</p>

          <h2 className="text-xl font-bold mt-6">8. Questions</h2>
          <p>If anything here is unclear, or you think we have got a labelling call wrong, tell us at <a href="mailto:info@cvrdnews.com" className="text-blue-600 underline">info@cvrdnews.com</a>. We would rather hear it.</p>
        </div>
      </div>
    </div>
  );
}
