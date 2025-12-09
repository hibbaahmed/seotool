"use client";

import { useState } from "react";

export default function SerpSnippetPreviewTool() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("https://example.com");
  const [description, setDescription] = useState("");
  
  // Limiters based on typical Google snippet limits
  const MAX_TITLE_LENGTH = 60;
  const MAX_DESCRIPTION_LENGTH = 160;

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">SERP Snippet Preview Tool</h1>
        <p className="text-gray-700 text-lg mb-6">
          Preview how your webpage's title, URL, and meta description will appear in Google search results. Optimize your snippet for maximum clicks and SEO impact.
        </p>

        {/* Input Form */}
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg border text-left">
          <label className="block mb-2 font-semibold" htmlFor="title">
            Page Title (max {MAX_TITLE_LENGTH} characters)
          </label>
          <input
            id="title"
            type="text"
            maxLength={MAX_TITLE_LENGTH}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your page title here"
            className="w-full border rounded-lg p-3 mb-4"
          />

          <label className="block mb-2 font-semibold" htmlFor="url">
            URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            className="w-full border rounded-lg p-3 mb-4"
          />

          <label className="block mb-2 font-semibold" htmlFor="description">
            Meta Description (max {MAX_DESCRIPTION_LENGTH} characters)
          </label>
          <textarea
            id="description"
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter your meta description here"
            className="w-full border rounded-lg p-3 mb-4 resize-none"
          />
        </div>
      </section>

      {/* Preview Section */}
      <section className="mt-12 max-w-3xl mx-auto bg-gray-50 p-6 rounded-lg border shadow-inner">
        <h2 className="text-xl font-semibold mb-3 text-blue-700">{title || "Page Title Will Appear Here"}</h2>
        <p className="text-green-700 mb-2">{url}</p>
        <p className="text-gray-800">{description || "Meta description will appear here, providing a concise summary of the page content to attract clicks from searchers."}</p>
      </section>

      {/* Why Use Section */}
      <section className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Why Use Our SERP Snippet Preview Tool?</h2>
        <p className="text-gray-700 mb-4">
          Google search snippets are often the first impression users get of your site. Our tool helps you:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Visualize how your snippet appears on Google search results</li>
          <li>Ensure your title and description are within Google’s length limits</li>
          <li>Optimize snippets to increase click-through rates (CTR)</li>
          <li>Preview desktop and mobile SERP appearance (coming soon)</li>
        </ul>
      </section>

      {/* Target Keywords Section */}
      <section className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Target Keywords</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li>google serp snippet preview tool</li>
          <li>serp snippet preview tool</li>
          <li>google serp snippet preview tool free</li>
          <li>google serp snippet preview tool online</li>
          <li>serp simulator free serp snippet preview tool</li>
          <li>serp snippet preview tool free</li>
          <li>serp snippet preview tool online</li>
        </ul>
      </section>

      {/* FAQ Section */}
      <section className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6 text-gray-700">
          <div>
            <h3 className="font-semibold text-lg">What is a SERP Snippet Preview Tool?</h3>
            <p>
              It’s a tool that lets you see how your page title, URL, and meta description will look on Google’s search engine results page (SERP).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Why is snippet length important?</h3>
            <p>
              Google truncates titles and descriptions that are too long, which can reduce click-through rates. Staying within limits improves user experience and SEO.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Is this tool free?</h3>
            <p>
              Yes! You can preview unlimited snippets for free to optimize your SEO.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Can I preview snippets for mobile?</h3>
            <p>
              Currently, this tool previews desktop snippets. Mobile preview will be added soon.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-20 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">
          Want More SEO Tools to Boost Your Rankings?
        </h2>
        <p className="text-gray-600 mb-6">
          Discover Bridgely’s full suite of AI-powered SEO and content marketing tools.
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
