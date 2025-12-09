"use client";

import { useState } from "react";

export default function ParagraphRewriter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  async function rewriteParagraph() {
    if (!input) return;

    const prompt = `Rewrite the following paragraph to improve clarity, uniqueness, and flow, while preserving the original meaning:\n\n${input}`;

    const res = await fetch("/api/rewrite-paragraph", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json());

    setOutput(res.output || "No rewritten paragraph generated. Please try again.");
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Paragraph Rewriter</h1>
        <p className="text-gray-700 text-lg mb-6">
          Instantly rewrite your paragraphs to improve clarity, uniqueness, and readability with our AI-powered Paragraph Rewriter. Perfect for students, writers, marketers, and SEO professionals.
        </p>

        {/* Input and Button */}
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border">
          <textarea
            rows={6}
            placeholder="Paste your paragraph here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4 resize-none"
          />
          <button
            onClick={rewriteParagraph}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 w-full font-semibold"
          >
            Rewrite Paragraph
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
        <h2 className="text-2xl font-semibold mb-4">Why Use Our Paragraph Rewriter?</h2>
        <p className="text-gray-700 mb-4">
          Our AI-powered tool helps you:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Rewrite paragraphs to be clearer and more engaging</li>
          <li>Enhance uniqueness and avoid plagiarism</li>
          <li>Improve flow and readability for any audience</li>
          <li>Save time rewriting content for blogs, essays, or marketing copy</li>
          <li>Get AI-enhanced writing help instantly and for free</li>
        </ul>
      </section>

      {/* Target Keywords Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Use Cases & Target Keywords</h2>
        <p className="text-gray-700 mb-2">
          This page targets high-value keywords like:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li>paragraph rewriter</li>
          <li>rewrite paragraph</li>
          <li>rewrite my paragraph</li>
          <li>ai paragraph rewriter</li>
          <li>free ai paragraph rewriter</li>
          <li>paragraph rewriter free</li>
          <li>paragraph rewrite</li>
          <li>rewrite a paragraph</li>
          <li>ai rewrite paragraph</li>
        </ul>
      </section>

      {/* FAQ Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg">What is a Paragraph Rewriter?</h3>
            <p className="text-gray-700">
              A Paragraph Rewriter is an AI tool that rewrites your text to improve clarity, originality, and flow while keeping the original meaning intact.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Is this Paragraph Rewriter free?</h3>
            <p className="text-gray-700">
              Yes! Our paragraph rewriting tool is free to use. For advanced writing assistance, check out Bridgely's full AI writing suite.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Can it rewrite any type of paragraph?</h3>
            <p className="text-gray-700">
              Absolutely. Whether it’s academic writing, blog posts, marketing copy, or casual text, our AI can help you rewrite it.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">How does rewriting help SEO?</h3>
            <p className="text-gray-700">
              Rewriting helps create unique content that avoids duplicate content penalties, improves readability, and can boost your rankings.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Want More AI Writing Tools?
        </h2>
        <p className="text-gray-600 mb-6">
          Explore Bridgely's full suite of AI content generation, rewriting, and publishing tools.
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
