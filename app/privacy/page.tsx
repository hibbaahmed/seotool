import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Nav from '../../components/Nav';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-8 text-slate-700 leading-relaxed">
            <section>
              <p>
                Welcome to Bridgely ("we," "our," or "us"). We are committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, and disclose information about you when you use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
              <p>
                We only collect email addresses from users who sign up for our services. We do not collect IP addresses, user activity logs, or other personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
              <p>
                We use collected email addresses to send account-related notifications and marketing emails. Users can unsubscribe from marketing emails at any time using the "Unsubscribe" link in our emails.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Data Sharing</h2>
              <p>
                We do not sell, share, or disclose user data to third parties. Payment processing is handled by Stripe, and we do not store credit card details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Data Retention and Security</h2>
              <p>
                We retain user data until a deletion request is made or during our periodic data-clearing process. We do not store sensitive data such as payment information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. User Rights</h2>
              <p>
                Users can request deletion of their data by contacting us. Users can view their article history on the website until their subscription ends.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Third-Party Services</h2>
              <p>
                We do not use third-party tracking tools such as Google Analytics, Hotjar, or Facebook Pixel. We do not share data with third-party partners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">7. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. The most current version will be posted on our website with the date of the last update.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">8. Contact</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy, please contact us at{' '}
                <a href="mailto:team@bridgely.io" className="text-blue-600 hover:text-blue-700 underline">
                  team@bridgely.io
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

