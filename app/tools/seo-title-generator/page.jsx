"use client";
import { useState } from "react";

export default function Page() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState("");

  async function generateDescription() {
    if (!keyword.trim()) return;

    const prompt = `Generate 5 SEO-optimized meta descriptions (150-160 characters) that include the keyword: ${keyword}. Make them high-CTR, natural, and readable.`;

    const res = await fetch("/api/generate-meta-description", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json());

    setResult(res.output || "No description generated.");
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-24">
      {/* HERO */}
      <section>
        <h1 className="text-4xl font-bold mb-4">
          Meta Description Generator (Free AI Tool)
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Instantly create SEO-optimized meta descriptions that boost click-through rate (CTR), improve Google visibility, and help your pages rank better.
        </p>

        {/* TOOL CARD */}
        <div className="bg-white shadow-lg rounded-xl p-6 border max-w-2xl">
          <input
            type="text"
            placeholder="Enter your keyword (e.g. AI SEO tools)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />

          <button
            onClick={generateDescription}
            className="bg-blue-600 text-white rounded-lg px-5 py-3 w-full font-semibold hover:bg-blue-700"
          >
            Generate Meta Description
          </button>

          {result && (
            <div className="mt-6 whitespace-pre-line bg-gray-50 p-4 rounded-lg border">
              {result}
            </div>
          )}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">
          Why Use a Meta Description Generator?
        </h2>
        <p className="text-gray-700 mb-4">
          Meta descriptions influence how often users click your search result. Strong descriptions can significantly increase your organic traffic without additional backlinks or content.
        </p>

        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Boost CTR with compelling descriptions</li>
          <li>Signal keyword relevance to Google</li>
          <li>Stay within the 150–160 character SEO limit</li>
          <li>Save time writing metadata for every page</li>
          <li>Optimize blogs, homepages, landing pages & ecommerce sites</li>
        </ul>
      </section>

      {/* KEYWORD VARIATIONS */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">
          Keywords This Page Helps You Rank For
        </h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li>meta description generator</li>
          <li>free meta description generator</li>
          <li>ai meta description generator</li>
          <li>homepage meta description generator</li>
          <li>website meta description generator</li>
          <li>generate meta description</li>
          <li>meta title and description generator</li>
        </ul>
      </section>

      {/* LONG SEO EXPLANATION */}
      <section className="mt-16 space-y-6 text-gray-700">
        <h2 className="text-2xl font-semibold">What Is a Meta Description?</h2>
        <p>
          A meta description is the short snippet of text that appears below your page title in Google search results. It tells users what your page is about and influences whether they click. While not a direct ranking factor, higher CTR improves Google visibility.
        </p>

        <h2 className="text-2xl font-semibold">Why Meta Descriptions Matter</h2>
        <p>
          Google often rewrites poorly written meta descriptions. If yours doesn’t match search intent, you lose clicks to competitors — even if you rank higher. A compelling description can dramatically increase traffic.
        </p>

        <h2 className="text-2xl font-semibold">How This Tool Works</h2>
        <ol className="list-decimal ml-6 space-y-2">
          <li>Enter your keyword or topic</li>
          <li>The tool generates multiple SEO-optimized descriptions</li>
          <li>You copy the version you like best</li>
        </ol>

        <h2 className="text-2xl font-semibold">Meta Description Best Practices</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Keep between 150–160 characters</li>
          <li>Include your main keyword near the beginning</li>
          <li>Use emotional or action-oriented language</li>
          <li>Answer user intent directly</li>
          <li>Avoid keyword stuffing</li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="mt-16 space-y-6">
        <h2 className="text-2xl font-semibold">FAQs</h2>

        <div>
          <h3 className="font-semibold text-lg">Is this generator free?</h3>
          <p>Yes — this Meta Description Generator is 100% free.</p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Does this improve SEO?</h3>
          <p>
            Yes. A strong meta description increases CTR, which indirectly boosts search rankings.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Can I use it for YouTube, Shopify, or WordPress?</h3>
          <p>Yes. The descriptions work for all platforms.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Want Full SEO Blog Posts Automatically Written for You?
        </h2>
        <p className="text-gray-600 mb-6">
          Use Bridgely to generate high-quality SEO articles and auto-publish them to WordPress.
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
