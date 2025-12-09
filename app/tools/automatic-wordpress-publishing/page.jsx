"use client";

import { useState } from "react";

export default function AutomaticWordPressPublishing() {
  const [wpUrl, setWpUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [content, setContent] = useState("");
  const [output, setOutput] = useState("");

  async function publishToWordPress() {
    if (!wpUrl || !username || !appPassword || !content) {
      setOutput("Please fill in all fields.");
      return;
    }

    const res = await fetch("/api/wp-publish", {
      method: "POST",
      body: JSON.stringify({
        wpUrl,
        username,
        appPassword,
        content,
      }),
    }).then((r) => r.json());

    setOutput(
      res?.success
        ? "Successfully published to WordPress!"
        : res?.error || "Publishing failed. Please check your credentials."
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* HERO */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Automatic WordPress Publishing</h1>
        <p className="text-gray-700 text-lg mb-6">
          Automatically publish AI-generated articles, newsletters, or content directly to your WordPress website—without logging in or manually posting. Perfect for bloggers, agencies, and content creators who want to automate their workflow.
        </p>

        {/* TOOL UI */}
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg border text-left">
          <label className="block mb-2 font-semibold">WordPress Site URL</label>
          <input
            type="text"
            placeholder="https://yourblog.com"
            value={wpUrl}
            onChange={(e) => setWpUrl(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />

          <label className="block mb-2 font-semibold">WordPress Username</label>
          <input
            type="text"
            placeholder="Your WP username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />

          <label className="block mb-2 font-semibold">WordPress App Password</label>
          <input
            type="password"
            placeholder="App Password (not regular password)"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />

          <label className="block mb-2 font-semibold">Content to Auto-Publish</label>
          <textarea
            rows={5}
            placeholder="Paste or generate your article content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4 resize-none"
          />

          <button
            onClick={publishToWordPress}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
          >
            Publish Automatically →
          </button>

          {output && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border text-gray-800">
              {output}
            </div>
          )}
        </div>
      </section>

      {/* WHY SECTION */}
      <section className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">
          Why Use Automatic WordPress Publishing?
        </h2>
        <p className="text-gray-700 mb-4">
          Stop manually pasting content into WordPress. Automate your uploads and speed up your content production workflow.
        </p>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Publish AI-generated content directly to WordPress</li>
          <li>Save time by automating repetitive tasks</li>
          <li>Perfect for content agencies, bloggers, or newsletters</li>
          <li>Integrates seamlessly with Bridgely AI blog generator</li>
          <li>Supports scheduled posting (coming soon)</li>
        </ul>
      </section>

      {/* KEYWORDS */}
      <section className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Target Keywords</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li>automatic wordpress publishing</li>
          <li>automatically publish from email to wordpress</li>
          <li>automatically promote wordpress blog once published</li>
          <li>automatically publish wordpress posts to facebook</li>
          <li>do edited pages automatically publish in wordpress</li>
          <li>does a new page in wordpress automatically get published</li>
          <li>email newsletter automatically send when published wordpress</li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6 text-gray-700">
          <div>
            <h3 className="font-semibold text-lg">How does automatic WordPress publishing work?</h3>
            <p>
              This tool uses the WordPress REST API and an App Password to securely publish content directly to your site without manual login.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">Is it safe to use?</h3>
            <p>
              Yes — WordPress App Passwords allow limited access and can be revoked anytime. Your main account password is never used.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">Can I schedule posts?</h3>
            <p>
              Scheduling is coming soon. For now, posts are published instantly.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Can I auto-publish AI-generated articles from Bridgely?
            </h3>
            <p>
              Yes! Generate blogs in Bridgely, then instantly publish them to WordPress with one click.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Automate Your WordPress Workflow</h2>
        <p className="text-gray-600 mb-6">
          Save time, scale your content output, and streamline your blogging process.
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
