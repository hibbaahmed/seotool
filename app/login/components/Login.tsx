"use client";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { toast } from "react-hot-toast";
import { Database } from "../../../types/supabase";
import { createClient } from '@supabase/supabase-js';
import disposableDomains from "disposable-email-domains";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { AiOutlineGoogle } from "react-icons/ai";
import { WaitingForMagicLink } from "./WaitingForMagicLink";
import { supabaseBrowser } from "../../../lib/supabase/browser";
import { useSearchParams } from "next/navigation";
import AuthComponent from "../../auth/components/AuthComponent";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import { ArrowRight, Mail, Loader2, Shield, CheckCircle, TrendingUp, Sparkles, Search } from "lucide-react";

type Inputs = {
  email: string;
};

export const Login = ({
  host,
  searchParams,
}: {
  host: string | null;
  searchParams?: { [key: string]: string | string[] | undefined };
}) => {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const validateEmail = (email: string) => {
    const re = /^[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return re.test(email);
  };

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setIsSubmitted(true);
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Invalid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithMagicLink(email);
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success("Email sent! Check your inbox for a magic link to sign in.", {
          duration: 5000,
        });
        setIsMagicLinkSent(true);
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again, if the problem persists, contact us at hello@seoflow.com", {
        duration: 5000,
      });
    }
  };

  let inviteToken = null;
  if (searchParams && "inviteToken" in searchParams) {
    inviteToken = searchParams["inviteToken"];
  }

  const protocol = host?.includes("localhost") ? "http" : "https";
  const redirectUrl = `${protocol}://${host}/auth/callback`;

  console.log({ redirectUrl });

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.log(`Error: ${error.message}`);
      throw error;
    }
  };

  if (isMagicLinkSent) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute w-64 h-64 bg-gradient-to-r from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl animate-pulse top-1/4 right-1/4"></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23E2E8F0%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center">
              {/* Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center border border-green-200 mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              {/* Content */}
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Check your email</h1>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We've sent you a magic link to sign in. Click the link to continue with SEOFlow.
              </p>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <p className="text-sm text-slate-600">
                  💡 If you don't see the email, check your spam folder or request a new link below.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-xl font-bold text-blue-600">500+</div>
                  <div className="text-xs text-slate-500 mt-1">Agencies</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-indigo-600">300%</div>
                  <div className="text-xs text-slate-500 mt-1">More Output</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">5/5</div>
                  <div className="text-xs text-slate-500 mt-1">Rating</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsMagicLinkSent(false);
                    setIsSubmitted(false);
                    setError("");
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                >
                  Send Another Link
                </button>
                <button
                  onClick={() => {
                    setIsMagicLinkSent(false);
                    setIsSubmitted(false);
                    setError("");
                  }}
                  className="w-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-gradient-to-r from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl animate-pulse top-1/4 right-1/4"></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23E2E8F0%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-40 right-40 opacity-10 pointer-events-none">
        <Search className="w-16 h-16 text-blue-400" />
      </div>
      <div className="absolute bottom-40 left-40 opacity-10 pointer-events-none">
        <Sparkles className="w-12 h-12 text-indigo-400" />
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 sm:p-10 text-center border-b border-slate-200">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 mb-6">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Welcome to SEOFlow
              </h1>
              <p className="text-slate-600">
                Sign in to start automating your SEO workflow
              </p>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-10 space-y-6">
              {/* Google Auth */}
              <AuthComponent/>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-500 font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Email Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 py-3 px-4 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200 outline-none"
                  />
                  {isSubmitted && error && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {error}
                    </p>
                  )}
                </div>

                <button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      Continue to SEOFlow
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Secure login with magic link • No password needed</span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-6 sm:p-8 space-y-4">
              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>No spam, ever</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>100% secure</span>
                </div>
              </div>

              {/* Legal Links */}
              <p className="text-xs text-slate-500 text-center">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-700 underline transition-colors">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Social Proof Below Form */}
          <div className="mt-8 text-center">
            <p className="text-slate-600 font-medium mb-4">Trusted by 500+ agencies worldwide</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">300%</div>
                <div className="text-xs text-slate-500">More Output</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">50+ hrs</div>
                <div className="text-xs text-slate-500">Hours Saved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">5/5</div>
                <div className="text-xs text-slate-500">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;