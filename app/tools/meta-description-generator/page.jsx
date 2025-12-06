"use client";
import { useState } from "react";
import Head from "next/head";

export default function Page() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState("");

  async function generateDescription() {
    if (!keyword.trim()) return;

    const prompt = `Generate 5 SEO-optimized meta descriptions (150-160 characters) that include the keyword: ${keyword}. Make them high-CTR and follow SEO best practices.`;

    const res = await fetch("/api/generate-meta-description", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json());

    setResult(res.output || "No description generated.");
  }

  return (
    <>
      {/* SEO HEAD TAGS */}
      <Head>
        <title>Meta Description Generator | Free AI SEO Tool</title>
        <meta
          name="description"
          content="Free AI Meta Description Generator. Instantly create SEO-optimized meta descriptions for websites, blogs, landing pages, and ecommerce pages. Boost CTR and rankings."
        />
        <meta
          name="keywords"
          content="meta description generator, free meta description generator, ai meta description generator, homepage meta description generator, website meta description generator, generate meta description"
        />
        <link rel="canonical" href="https://bridgely.io/meta-description-generator" />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-24">
        
        {/* HERO */}
        <section className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            Meta Description Generator (Free AI Tool)
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Generate SEO-optimized meta descriptions that improve click-through
            rates (CTR), support Google rankings, and help your pages perform
            better in search results.
          </p>

          {/* TOOL UI */}
          <div className="bg-white shadow-lg rounded-xl p-6 border mx-auto max-w-2xl">
            <input
              type="text"
              placeholder="Enter your keyword or topic (e.g. AI SEO tools)"
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
              <div className="mt-6 whitespace-pre-line bg-gray-50 p-4 rounded-lg border text-left">
                {result}
              </div>
            )}
          </div>
        </section>

        {/* SEO BENEFITS SECTION */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-4">
            Why Use an AI Meta Description Generator?
          </h2>
          <p className="text-gray-700 mb-4">
            Your meta description is one of the most important elements for
            improving organic click-through rates. This tool generates
            keyword-rich, user-focused descriptions that signal relevance to
            Google and grab attention in search results.
          </p>

          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>Boost CTR with compelling descriptions</li>
            <li>Improve Google impressions and search performance</li>
            <li>Stay within ideal 150–160 character SEO length</li>
            <li>Optimize homepages, blogs, landing pages, and ecommerce sites</li>
            <li>Save time with instantly generated variations</li>
          </ul>
        </section>

        {/* KEYWORD VARIATION SECTION */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-4">
            Meta Description Generator — Where This Page Ranks Best
          </h2>
          <p className="text-gray-700">
            This page is optimized for high-intent search terms such as:
          </p>
          <ul className="list-disc ml-6 text-gray-700 space-y-1 mt-2">
            <li>meta description generator</li>
            <li>free meta description generator</li>
            <li>ai meta description generator</li>
            <li>website meta description generator</li>
            <li>homepage meta description generator</li>
            <li>generate meta description</li>
            <li>meta title and description generator</li>
          </ul>
        </section>

        {/* LONG SEO COPY */}
        <section className="mt-16 space-y-6 text-gray-700">
          <h2 className="text-2xl font-semibold">What Is a Meta Description?</h2>
          <p>
            A meta description is a short summary of a webpage that appears in
            Google search results. Although not a direct ranking factor, it
            heavily influences CTR — which impacts your search performance.
          </p>

          <h2 className="text-2xl font-semibold">Why Meta Descriptions Matter</h2>
          <p>
            Google uses meta descriptions to understand page content and match
            search intent. A well-crafted description increases your chances of
            getting clicks, visibility, and better rankings.
          </p>

          <h2 className="text-2xl font-semibold">How Our Meta Description Tool Works</h2>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Enter your keyword or topic</li>
            <li>Generate optimized meta descriptions</li>
            <li>Copy and paste into your website or CMS</li>
          </ol>

          <h2 className="text-2xl font-semibold">Best Practices for SEO Meta Descriptions</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Include your keyword early</li>
            <li>Keep it between 150–160 characters</li>
            <li>Use emotional and action-driven words</li>
            <li>Write for humans first, Google second</li>
          </ul>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">
            Meta Description Generator — FAQs
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Is this tool free?</h3>
              <p>This AI meta description generator is 100% free to use.</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Does it help SEO?</h3>
              <p>
                Yes — optimized meta descriptions increase CTR, which helps your
                pages rank higher on Google.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">
                Can I use it for my homepage?
              </h3>
              <p>
                Absolutely. It's perfect for homepages, blogs, product pages,
                landing pages, and more.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">
                Does it work for YouTube descriptions?
              </h3>
              <p>Yes — you can use it to optimize YouTube SEO metadata as well.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Want Full SEO Blog Posts — Not Just Meta Descriptions?
          </h2>
          <p className="text-gray-600 mb-6">
            Generate full SEO-optimized articles and auto-publish to WordPress
            using Bridgely.
          </p>
          <a
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
          >
            Try Bridgely Free →
          </a>
        </section>
      </main>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Meta Description Generator",
            url: "https://bridgely.io/meta-description-generator",
            applicationCategory: "SEO Tool",
            description:
              "Free AI Meta Description Generator for websites, blogs, and landing pages. Improve your SEO and Google click-through rate.",
          }),
        }}
      />
    </>
  );
}
