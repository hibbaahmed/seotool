"use client";

import React, { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { Button } from "./ui/Button";
import { 
  Sparkles, 
  Home, 
  Code, 
  Palette, 
  LogOut, 
  Menu, 
  ChevronDown, 
  Settings,
  Zap,
  FileText,
  Download,
  Eye,
  Monitor,
  Sun,
  DollarSign,
  BookOpen,
  Github,
  ArrowRight,
  Database,
  Calendar,
  CreditCard
} from "lucide-react";
import { supabase } from '../utils/supabaseClient';
import ClientSideCredits from './realtime/ClientSideCredits';

interface NavbarProps {
  user: any;
  credits?: any;
}

export default function AuthenticatedNavbar({ user, credits }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300
      ${scrolled ? 'py-3 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' : 'py-4 bg-white/90 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 relative z-10">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-bold text-3xl lg:text-4xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Bridgely
            </h2>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          <Link href="/dashboard" className="flex items-center px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium">
            Dashboard
          </Link>
          
          <Link href="/calendar" className="flex items-center px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium">
            Calendar
          </Link>
          <Link href="/price" className="flex items-center px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium">
            Pricing
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Credits Display */}
              {credits && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-2.5 flex items-center space-x-3 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <ClientSideCredits creditsRow={credits} />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full border-2 border-blue-400 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-lg transition-colors duration-200 hover:bg-gray-50 font-medium">
                Log in
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md flex items-center space-x-2 transition-all duration-200">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <Menu size={24} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`lg:hidden fixed left-0 right-0 w-full bg-white/95 backdrop-blur-md z-40 transform transition-transform ease-in-out duration-300 overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ top: '60px', height: 'calc(100vh - 60px)' }}
      >
        <div className="px-4 py-6">
          <div className="flex flex-col space-y-2">
            <Link href="/dashboard" className="block px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200 font-medium">
              Dashboard
            </Link>
            <Link href="/calendar" className="block px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200 font-medium">
              Calendar
            </Link>
            <Link href="/price" className="block px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200 font-medium">
              Pricing
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            {user ? (
              <div className="space-y-4">
                {/* Mobile Credits Display */}
                {credits && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-3 flex items-center space-x-3 border border-blue-200 shadow-sm mb-4">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <ClientSideCredits creditsRow={credits} />
                  </div>
                )}
                
                <div className="flex items-center px-4 py-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full border-2 border-blue-400 flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-semibold">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200 font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="w-full mb-3 border-gray-300 text-gray-600 py-3 hover:bg-gray-50 font-medium">
                    Log in
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3 flex items-center justify-center shadow-sm hover:shadow-md font-medium">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center px-4 py-3">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Need help?</p>
                <Link href="mailto:team@bridgely.io" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}