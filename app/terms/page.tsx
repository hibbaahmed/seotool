import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Nav from '../../components/Nav';

export default function TermsPage() {
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
            Terms and Conditions
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-8 text-slate-700 leading-relaxed">
            <section>
              <p>
                Welcome to Bridgely ("we," "us," "our"). By accessing or using our services, you agree to comply with and be bound by these terms and conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Description of Service</h2>
              <p>
                Bridgely provides an AI-powered blog post generator that allows users to generate content based on keyword inputs. Our services are offered as a monthly subscription through Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Subscription and Payment</h2>
              <p>
                Bridgely operates on a recurring monthly subscription basis. Payment is processed through Stripe, and users agree to Stripe's terms and policies. Subscriptions renew automatically unless canceled by the user before the renewal date. Credits for article generation and keyword requests do not roll over to the next month. Users may cancel their subscription at any time, and access will continue until the end of the billing cycle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Refund Policy</h2>
              <p className="mb-4">
                We want to make sure you are completely satisfied with Bridgely. We offer refunds under the following conditions:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>No article credits have been used.</li>
                <li>No keyword request credits have been used.</li>
                <li>The service has not been utilized yet.</li>
                <li>The refund request is made within 24 hours of the initial purchase or subscription.</li>
              </ul>
              <p className="mb-4">
                To request a refund, please contact us at{' '}
                <a href="mailto:team@bridgely.io" className="text-blue-600 hover:text-blue-700 underline">
                  team@bridgely.io
                </a>{' '}
                within 24 hours of your purchase. Please note that the trial $1 fee is non-refundable under any circumstances.
              </p>
              <p>
                If you experience any technical issues with our service, please reach out to us and we will do our best to resolve them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Account Usage and Limitations</h2>
              <p>
                Users are not allowed to share their accounts with others. Users are allowed to resell AI-generated articles. AI-generated content may require fact-checking or human review before publishing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Data Privacy and Security</h2>
              <p>
                We do not collect personal data other than email addresses. Payment details are processed securely through Stripe, and we do not store any sensitive payment information. Users can request data deletion by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Communications and Email Consent</h2>
              <p className="mb-4">
                By creating an account and using Bridgely, you agree to receive communications from us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>
                  <strong>Service-related emails:</strong> Essential communications about your account, subscription status, billing, technical issues, security updates, and important service announcements.
                </li>
                <li>
                  <strong>Marketing emails:</strong> Product updates, new features, tips for using Bridgely, newsletters, promotional offers, and other marketing communications.
                </li>
              </ul>
              <p>
                You may opt out of marketing emails at any time by clicking the "unsubscribe" link at the bottom of any marketing email or by contacting us at{' '}
                <a href="mailto:team@bridgely.io" className="text-blue-600 hover:text-blue-700 underline">
                  team@bridgely.io
                </a>. Please note that even if you opt out of marketing emails, you will still receive essential service-related communications regarding your account and subscription.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">7. Dispute Resolution</h2>
              <p>
                Any disputes, claims, or controversies arising out of or relating to Bridgely shall be governed by and construed in accordance with the laws of Lithuania. Any legal proceedings shall be subject to the exclusive jurisdiction of Lithuanian courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">8. Updates to Terms</h2>
              <p>
                We reserve the right to update or modify these terms at any time. Changes will be posted on our website, and it is the user's responsibility to review these terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">9. Contact</h2>
              <p>
                For any inquiries, please contact us at{' '}
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

