import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | CVRD News",
  description: "Get in touch with CVRD News — press enquiries, corrections, or general questions.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: '#1e2a3a' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <a href="/" aria-label="CVRD News home">
            <img src="/logo3.png" alt="CVRD News" className="h-24 mx-auto mb-6 opacity-90" />
          </a>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Contact
          </h1>
          <p className="text-[#aaa] text-[15px]">We read every message</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg p-8 md:p-12 space-y-8 text-[15px] text-[#333] leading-[1.75]">

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>General Enquiries</h2>
            <p>
              For general questions about CVRD News, reach us at{" "}
              <a href="mailto:info@cvrdnews.com" className="text-blue-600 underline font-medium">info@cvrdnews.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Press & Media</h2>
            <p>
              Journalists and researchers can reach our team at{" "}
              <a href="mailto:info@cvrdnews.com" className="text-blue-600 underline font-medium">info@cvrdnews.com</a>{" "}
              with the subject line <strong>Press</strong>. We aim to respond to press enquiries within 48 hours on business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Corrections</h2>
            <p>
              If you believe any content published by CVRD News — including On Record politician ratings — is factually incorrect or misattributed, please email us at{" "}
              <a href="mailto:info@cvrdnews.com" className="text-blue-600 underline font-medium">info@cvrdnews.com</a>{" "}
              with the subject line <strong>Correction</strong>. Include the specific claim, the URL where it appears, and the supporting evidence for your correction. We review all corrections and update our records where warranted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>About Andlane</h2>
            <p>
              CVRD News is built by <strong>Andlane</strong>, an independent technology and automation studio based in London, UK. For enquiries about Andlane's work or collaboration, email{" "}
              <a href="mailto:info@cvrdnews.com" className="text-blue-600 underline font-medium">info@cvrdnews.com</a>.
            </p>
          </section>

          <div className="pt-2 border-t border-[#eee] text-[13px] text-[#888]">
            CVRD News · Andlane Ltd · London, UK
          </div>

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
            <a href="/terms" className="text-[12px] text-[#888] hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </div>
  );
}
