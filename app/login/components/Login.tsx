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
import { Mail, ArrowRight, Loader2, Video, Sparkles, Star, Shield, CheckCircle } from 'lucide-react';

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
        toast.success("Email sent! Check your inbox for a magic link to sign in.", {
          duration: 5000,
        });
        setIsMagicLinkSent(true);
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      toast.error("Something went wrong. Please try again, if the problem persists, contact us at hello@vidfix.io", {
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
    }
  };

  if (isMagicLinkSent) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* Purple Gradient Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-lg bg-black/60 border border-slate-600 backdrop-blur-xl">
            <CardHeader className="space-y-6 text-center">
              <div className="mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 w-20 h-20 flex items-center justify-center border border-purple-500/30">
                <Mail className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-white mb-2">Check your email</CardTitle>
                <CardDescription className="text-gray-300 text-lg">
                  We've sent you a magic link to sign in
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-gray-300">
                  Click the link in your email to continue. If you don't see it, check your spam folder.
                </p>
              </div>
              
              {/* Additional messaging */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Your account is being prepared</span>
                </div>
                <p className="text-gray-400">
                  You're moments away from creating viral content!
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full bg-transparent border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500 transition-all duration-200"
                onClick={() => setIsMagicLinkSent(false)}
              >
                Back to login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Purple Gradient Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Floating Elements */}
      <div className="absolute top-40 right-40 opacity-30">
        <Video className="w-8 h-8 text-purple-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="absolute bottom-40 left-40 opacity-30">
        <Sparkles className="w-6 h-6 text-pink-400 animate-bounce" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-2xl mx-auto">
          
          {/* Centered Login Form */}
          <div className="w-full max-w-md mx-auto px-2 sm:px-0">
            <Card className="bg-black/60 border border-slate-600 backdrop-blur-xl shadow-2xl">
              <CardHeader className="space-y-4 text-center px-4 sm:px-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                  <Video className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Welcome to VidFix
                  </CardTitle>
                  <CardDescription className="text-gray-300 mt-2">
                    Sign in to start creating viral content
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-4 sm:px-6">
                {/* Google Auth Component */}
                <AuthComponent/>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-4 text-gray-400">
                      Or continue with email
                    </span>
                  </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 h-12 rounded-xl focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                      {...register("email", {
                        required: true,
                        validate: {
                          emailIsValid: (value: string) =>
                            /^[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ||
                            "Please enter a valid email",
                          emailDoesntHavePlus: (value: string) =>
                            !value.includes('+') ||
                            "Email addresses with a '+' are not allowed",
                          emailIsntDisposable: (value: string) => {
                            const domain = value.split("@")[1];
                            return !domain || !disposableDomains.includes(domain) ||
                              "Please use a permanent email address";
                          },
                        },
                      })}
                    />
                    {isSubmitted && errors.email && (
                      <p className="text-sm text-red-400 flex items-center gap-2">
                        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                        {errors.email.message || "Email is required"}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-purple-500/25"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending magic link...
                      </>
                    ) : (
                      <>
                        Continue to VidFix
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Secure login with magic link</span>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 text-center px-4 sm:px-6 pb-6">
                {/* Trust Indicators */}
                <div className="grid grid-cols-2 gap-4 w-full text-xs">
                  <div className="flex items-center justify-center gap-1 text-gray-400">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span>No spam, ever</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-gray-400">
                    <Shield className="w-3 h-3 text-green-400" />
                    <span>100% secure</span>
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="text-purple-400 hover:text-purple-300 underline transition-colors">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-purple-400 hover:text-purple-300 underline transition-colors">
                    Privacy Policy
                  </a>
                </div>
              </CardFooter>
            </Card>

            {/* Mobile Benefits (shown below form on mobile) */}
            <div className="mt-8 space-y-4 px-2 text-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-4">Join 500K+ creators</h3>
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div>
                    <div className="text-xl font-bold text-purple-400">10M+</div>
                    <div className="text-xs text-gray-400">Videos</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-400">2.3M</div>
                    <div className="text-xs text-gray-400">Avg Views</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-400">$12K</div>
                    <div className="text-xs text-gray-400">Avg Monthly</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;