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
      <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23E2E8F0%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-300/30">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300/60 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Welcome to Bridgely</h1>
              <p className="text-slate-600 text-lg leading-relaxed">
                Sign in or create an account to get started.
              </p>
            </div>
            {/* Auth Component */}
            <div className="mb-6">
              <AuthComponent/>
            </div>
            
            <OR />
            
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Input
                  type="email"
                  className="w-full px-4 py-4 text-slate-700 bg-slate-50/80 border border-slate-300/60 rounded-xl placeholder-slate-400 focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500 transition-all duration-200 text-base"
                  placeholder="Enter your email address"
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
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl shadow-blue-400/25 hover:shadow-blue-400/40 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                type="submit"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending magic link...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Continue with Email</span>
                  </div>
                )}
              </Button>
            </form>
            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <p className="text-center text-sm text-slate-500">
                By continuing, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Privacy Policy
                </a>
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