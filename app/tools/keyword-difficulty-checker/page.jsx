"use client";

import { useState } from "react";

export default function KeywordDifficultyChecker() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  async function checkDifficulty() {
    if (!input) return;

    const prompt = `Provide a detailed keyword difficulty analysis for the keyword: "${input}". Include competition level, estimated difficulty score, and tips for ranking.`;

    const res = await fetch("/api/check-keyword-difficulty", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json());

    setOutput(res.output || "No analysis generated. Please try again.");
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Keyword Difficulty Checker</h1>
        <p className="text-gray-700 text-lg mb-6">
          Instantly check the difficulty of ranking for any keyword with our AI-powered Keyword Difficulty Checker. Perfect for SEO professionals, marketers, and content creators.
        </p>

        {/* Input and Button */}
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border">
          <input
            type="text"
            placeholder="Enter your keyword (e.g., best running shoes)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />
          <button
            onClick={checkDifficulty}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 w-full font-semibold"
          >
            Check Keyword Difficulty
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
        <h2 className="text-2xl font-semibold mb-4">Why Use Our Keyword Difficulty Checker?</h2>
        <p className="text-gray-700 mb-4">
          Understanding keyword difficulty helps you prioritize the best keywords to target and maximize your SEO efforts. Our AI-powered tool provides:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Accurate keyword competition assessment</li>
          <li>Estimated difficulty scores based on SEO metrics</li>
          <li>Actionable tips to improve your ranking chances</li>
          <li>Free and easy-to-use tool for marketers and bloggers</li>
        </ul>
      </section>

      {/* Target Keywords Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Use Cases & Target Keywords</h2>
        <p className="text-gray-700 mb-2">
          This tool is designed to rank for keywords such as:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li>keyword difficulty checker</li>
          <li>keyword difficulty checker free</li>
          <li>check keyword difficulty</li>
          <li>how to check keyword difficulty</li>
          <li>free keyword difficulty checker</li>
          <li>keyword difficulty check</li>
          <li>keyword difficulty checker tool</li>
          <li>bulk keyword difficulty checker</li>
          <li>keyword seo difficulty checker tool</li>
        </ul>
      </section>

      {/* FAQ Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg">What is Keyword Difficulty?</h3>
            <p className="text-gray-700">
              Keyword difficulty measures how hard it is to rank on the first page of Google for a specific keyword, based on competition and SEO metrics.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Is this tool free?</h3>
            <p className="text-gray-700">
              Yes! Our Keyword Difficulty Checker is completely free to use.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">How accurate is the difficulty score?</h3>
            <p className="text-gray-700">
              Our AI provides an estimate based on SEO best practices and data, but for detailed metrics, consider professional SEO tools like Ahrefs or SEMrush.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Can I check multiple keywords at once?</h3>
            <p className="text-gray-700">
              Currently, this tool supports one keyword at a time. Bulk checking is planned for future updates.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Want More SEO Tools to Boost Your Rankings?
        </h2>
        <p className="text-gray-600 mb-6">
          Explore Bridgely’s complete suite of AI-powered SEO and content marketing tools.
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
