"use client";

import { useState } from "react";

export default function CompetitorContentAnalyzer() {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [output, setOutput] = useState("");

  async function analyzeContent() {
    if (!competitorUrl) return;

    const prompt = `Analyze the content strategy of the website at this URL: ${competitorUrl}. Provide insights on content topics, freshness, SEO keywords targeted, strengths, and recommendations to improve without copying.`;

    const res = await fetch("/api/analyze-competitor-content", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json());

    setOutput(res.output || "No analysis generated. Please try again.");
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Competitor Content Analyzer</h1>
        <p className="text-gray-700 text-lg mb-6">
          Gain valuable insights into your competitors' content strategies without copying. Discover topics, keywords, and tactics to refine your own content marketing efforts.
        </p>

        {/* Input and Button */}
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border">
          <input
            type="url"
            placeholder="Enter competitor website URL (e.g., https://competitor.com)"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />
          <button
            onClick={analyzeContent}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 w-full font-semibold"
          >
            Analyze Competitor Content
          </button>

          {/* Output */}
          {output && (
            <div className="mt-6 bg-gray-50 p-5 rounded-lg border whitespace-pre-line text-left">
              {output}
            </div>
          )}
        </div>
      </section>

      {/* Why Use Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Why Use Our Competitor Content Analyzer?</h2>
        <p className="text-gray-700 mb-4">
          Understanding your competitors' content strategy can give you a significant edge. Our tool helps you:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Identify successful content topics and formats</li>
          <li>Discover SEO keywords your competitors are targeting</li>
          <li>Analyze content freshness and posting cadence</li>
          <li>Get actionable recommendations without copying content</li>
          <li>Improve your own content strategy with data-driven insights</li>
        </ul>
      </section>

      {/* Target Keywords Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Target Keywords</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li>how to analyze competitors content strategy without copying</li>
          <li>how to analyze competitors blogs for content strategy</li>
          <li>analyzing competitor backlink profiles for content marketing</li>
          <li>analyze competitor content</li>
          <li>analyze competitors content</li>
          <li>competitor keywords vs content analyzer tool</li>
          <li>how do i analyze my competitors content strategies</li>
        </ul>
      </section>

      {/* FAQ Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6 text-gray-700">
          <div>
            <h3 className="font-semibold text-lg">What does the Competitor Content Analyzer do?</h3>
            <p>
              It examines your competitor’s website to uncover their content topics, SEO keywords, posting frequency, and strategy insights — all without copying their work.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Is this tool free?</h3>
            <p>
              Yes! You can analyze competitor content for free to sharpen your marketing strategy.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Can this help me find new content ideas?</h3>
            <p>
              Absolutely. By seeing what works for your competitors, you can discover fresh topics and angles for your own content.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">How do I avoid copying competitor content?</h3>
            <p>
              Our tool provides analysis and insights for inspiration only. We recommend creating original content based on your unique value and audience.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Outperform Your Competitors?
        </h2>
        <p className="text-gray-600 mb-6">
          Use Bridgely’s AI-powered content and SEO tools to build a winning strategy that drives traffic and conversions.
        </p>
        <a
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
        >
          Try Bridgely Free →
        </a>
      </section>
    </main>
  );
}
