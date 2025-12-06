"use client"
import { useState } from "react";

export default function Page() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState("");

  async function generateTitle() {
    if (!keyword) return;

    const prompt = `Generate 10 high-CTR SEO titles for the topic: ${keyword}.`;
    const res = await fetch("/api/generate-title", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json());

    setResult(res.output || "No title generated.");
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-24">
      {/* HERO */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          SEO Title Generator (Free AI Tool)
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Generate high-CTR SEO-optimized titles for blogs, articles, YouTube
          videos, and web pages. Perfect for marketers, bloggers, and SEO
          experts in 2025.
        </p>

        {/* TOOL UI */}
        <div className="bg-white shadow-lg rounded-xl p-6 border mx-auto max-w-2xl">
          <input
            type="text"
            placeholder="Enter your keyword (e.g. best gaming laptops)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />
          <button
            onClick={generateTitle}
            className="bg-blue-600 text-white rounded-lg px-5 py-3 w-full font-semibold hover:bg-blue-700"
          >
            Generate SEO Title
          </button>

          {result && (
            <div className="mt-6 whitespace-pre-line bg-gray-50 p-4 rounded-lg border text-left">
              {result}
            </div>
          )}
        </div>
      </section>

      {/* SEO BENEFITS */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">
          Why Use an SEO Title Generator?
        </h2>
        <p className="text-gray-700 mb-4">
          Your title tag is one of the strongest ranking factors and impacts
          click-through rates (CTR) more than anything else. Our free SEO Title
          Generator uses AI to craft engaging, keyword-rich titles designed to
          rank higher on Google.
        </p>

        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Improve CTR with compelling, emotional title tags</li>
          <li>Increase rankings with optimized keywords</li>
          <li>Boost traffic for blogs, websites, and YouTube</li>
          <li>Instantly generate 10+ variations for A/B testing</li>
        </ul>
      </section>

      {/* KEYWORD VARIATIONS SECTION */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">
          SEO Title Generator Use Cases
        </h2>
        <p className="text-gray-700">
          This tool is optimized to rank for terms like:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-1 mt-2">
          <li>seo title generator</li>
          <li>seo title tag generator</li>
          <li>free seo title generator</li>
          <li>best seo title generator</li>
          <li>seo optimized title generator</li>
          <li>blog title generator for SEO</li>
          <li>ai seo title generator</li>
          <li>youtube title seo generator</li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">
          SEO Title Generator — FAQs
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg">
              What is an SEO Title Generator?
            </h3>
            <p className="text-gray-700">
              It’s a tool that uses AI to create high-CTR, keyword-optimized
              title tags for blogs, websites, products, and YouTube videos.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Is this SEO Title Generator free?
            </h3>
            <p className="text-gray-700">
              Yes — the title generator is free to use. For full blog generation
              and WordPress publishing, try Bridgely AI.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Does it work for YouTube titles?
            </h3>
            <p className="text-gray-700">
              Yes! It can generate YouTube SEO titles optimized for rankings and
              suggested browse traffic.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Does it improve Google rankings?
            </h3>
            <p className="text-gray-700">
              Strong title tags improve CTR — which directly boosts rankings.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Want Full SEO Blog Posts — Not Just Titles?
        </h2>
        <p className="text-gray-600 mb-6">
          Generate full SEO-optimized articles and auto-publish to WordPress
          with Bridgely.
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
