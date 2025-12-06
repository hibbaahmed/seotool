"use client";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { toast } from "react-hot-toast";
import { Database } from "../../../types/supabase";
import disposableDomains from "disposable-email-domains";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { AiOutlineGoogle } from "react-icons/ai";
import { WaitingForMagicLink } from "./WaitingForMagicLink";
import { supabase } from "../../../utils/supabaseClient";
import { useSearchParams } from "next/navigation";
import AuthComponent from "../../auth/components/AuthComponent";
import Image from "next/image";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setIsSubmitting(true);
    try {
      await signInWithMagicLink(data.email);
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success("Email sent! Check your inbox for a magic link to sign in.");
        setIsMagicLinkSent(true);
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      toast.error("Something went wrong. Please try again, if the problem persists, contact us at team@bridgely.io");
    }
  };
  let inviteToken = null;
  if (searchParams && "inviteToken" in searchParams) {
    inviteToken = searchParams["inviteToken"];
  }
  const protocol = host?.includes("localhost") ? "http" : "https";
  // Always use www subdomain for consistency (except localhost)
  let normalizedHost = host;
  if (host && !host.includes("localhost") && !host.startsWith("www.")) {
    normalizedHost = `www.${host}`;
  }
  const redirectUrl = `${protocol}://${normalizedHost}/auth/callback`;
  console.log({ redirectUrl, originalHost: host, normalizedHost });
  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) {
      console.log(`Error: ${error.message}`);
      throw new Error(error.message);
    }
  };
  if (isMagicLinkSent) {
    return (
      <WaitingForMagicLink toggleState={() => setIsMagicLinkSent(false)} />
    );
  }
  return (
    <>
      <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23E2E8F0%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30"></div>
        
        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white p-8 sm:p-10 rounded-3xl">
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                  Welcome to <span className="text-blue-600">Bridgely</span>
                </h1>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Turn your SEO strategy into a content machine that writes, optimizes, and publishes while you sleep.
                </p>
              </div>

              {/* Auth Component */}
              <div className="mb-6">
                <AuthComponent/>
              </div>
              
              <OR />
              
              <div className="text-center mb-4">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Or continue with email</p>
              </div>
              
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Input
                    type="email"
                    className="w-full px-4 py-4 text-slate-700 bg-slate-50/80 border border-slate-300/60 rounded-xl placeholder-slate-400 focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500 transition-all duration-200 text-base"
                    placeholder="name@example.com"
                    {...register("email", {
                      required: true,
                      validate: {
                        emailIsValid: (value: string) =>
                          /^[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ||
                          "Please enter a valid email",
                        emailDoesntHavePlus: (value: string) =>
                          /^[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ||
                          "Email addresses with a '+' are not allowed",
                        emailIsntDisposable: (value: string) =>
                          !disposableDomains.includes(value.split("@")[1]) ||
                          "Please use a permanent email address",
                      },
                    })}
                  />
                  {isSubmitted && errors.email && (
                    <div className="flex items-center gap-2 mt-2">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-600">
                        {errors.email?.message || "Email is required to sign in"}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl shadow-blue-400/25 hover:shadow-blue-400/40 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  type="submit"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending magic link...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Send Magic Link</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </Button>
              </form>
              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-200/80">
                <p className="text-center text-sm text-slate-500">
                  By continuing, you agree to our{" "}
                  <a href="/terms" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Testimonial */}
          <div className="hidden lg:flex flex-col items-center justify-center relative px-8">
            {/* Quotation Mark Icon */}
            <div className="absolute -top-6 -left-6 text-blue-100 text-[120px] leading-none font-serif select-none pointer-events-none z-0">
              "
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 relative z-10 w-full max-w-md">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md ring-2 ring-blue-100">
                  MJ
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg">Michael Chen</div>
                  <div className="text-sm text-slate-600">Head of Marketing, TechScale Agency</div>
                </div>
              </div>
              
              <p className="text-slate-700 leading-relaxed text-base italic">
                We went from publishing 4 articles per month to 40+—all while maintaining our quality standards. Bridgely doesn't just generate content, it generates results. Our organic traffic doubled in the first quarter, and we've already recovered our investment three times over.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export const OR = () => {
  return (
    <div className="flex items-center my-6">
      <div className="border-b border-slate-300/60 flex-grow mr-4" />
      <span className="text-sm text-slate-600 font-medium bg-white px-3 py-1 rounded-full border border-slate-300/60">OR</span>
      <div className="border-b border-slate-300/60 flex-grow ml-4" />
    </div>
  );
};