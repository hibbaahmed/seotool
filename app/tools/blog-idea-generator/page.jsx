// app/blog-idea-generator/page.jsx
"use client";

import { useState } from "react";

export default function BlogIdeaGenerator() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  async function generateIdeas() {
    if (!input) return;

    const prompt = `Generate 10 creative, SEO-friendly blog topic ideas for the niche: ${input}. Provide ideas that are unique, engaging, and relevant for 2025 content marketing.`;

    const res = await fetch("/api/generate-blog-ideas", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json());

    setOutput(res.output || "No ideas generated. Please try again.");
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Blog Idea Generator</h1>
        <p className="text-gray-700 text-lg mb-6">
          Instantly generate fresh, creative blog topic ideas tailored for your niche. Perfect for bloggers, marketers, and businesses looking to grow their content in 2025.
        </p>

        {/* Input and Button */}
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border">
          <input
            type="text"
            placeholder="Enter your niche or keyword (e.g., fitness, SaaS marketing)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />
          <button
            onClick={generateIdeas}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 w-full font-semibold"
          >
            Generate Blog Ideas
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
        <h2 className="text-2xl font-semibold mb-4">Why Use Our Blog Idea Generator?</h2>
        <p className="text-gray-700 mb-4">
          Struggling to come up with engaging blog topics? Our AI-powered Blog Idea Generator helps you:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Generate unique blog ideas tailored to your niche and audience</li>
          <li>Save time brainstorming content topics</li>
          <li>Discover SEO-friendly topics that can rank higher on Google</li>
          <li>Boost your content marketing with fresh, relevant ideas for 2025</li>
        </ul>
      </section>

      {/* Target Keywords Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Use Cases & Target Keywords</h2>
        <p className="text-gray-700 mb-2">
          This tool is optimized to help you rank for keywords such as:
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li>blog ideas generator</li>
          <li>blog idea generator</li>
          <li>blog post ideas generator</li>
          <li>blog content ideas generator</li>
          <li>blog topic idea generator</li>
          <li>generate blog post ideas for industries</li>
          <li>hubspot blog ideas generator</li>
          <li>blog topic ideas generator</li>
        </ul>
      </section>

      {/* FAQ Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg">What is a Blog Idea Generator?</h3>
            <p className="text-gray-700">
              It’s an AI-powered tool that helps you create unique and SEO-friendly blog topics, making content planning easier and faster.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Is this tool free to use?</h3>
            <p className="text-gray-700">
              Yes! You can generate blog ideas for free. For full blog content generation, check out Bridgely’s AI Blog Writing service.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Can this tool generate ideas for any niche?</h3>
            <p className="text-gray-700">
              Absolutely. Just enter your niche or keywords, and the AI will tailor ideas to your specific industry or audience.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">How can this help with SEO?</h3>
            <p className="text-gray-700">
              The generated blog ideas are optimized to target keywords with high search intent, improving your chances of ranking on Google.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Want Full SEO Blog Posts, Not Just Ideas?
        </h2>
        <p className="text-gray-600 mb-6">
          Generate complete SEO-optimized blog posts and publish automatically with Bridgely AI.
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
