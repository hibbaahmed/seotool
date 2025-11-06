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
  Github
} from "lucide-react";
import { supabase } from '../utils/supabaseClient';

export default function Nav({ user }) {
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
      ${scrolled ? 'py-3 bg-white/98 backdrop-blur-xl shadow-xl border-b border-gray-100' : 'py-5 bg-gradient-to-r from-white/90 via-white/95 to-white/90 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 relative z-10 group">
          <div className="flex items-center">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mr-3 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <Sparkles className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <h2 className="font-bold text-3xl lg:text-4xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight group-hover:from-purple-700 group-hover:via-blue-700 group-hover:to-indigo-700 transition-all duration-300">
              Bridgely
            </h2>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-2">

          {/* Features Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center group">
                <Link href="/features" className="flex items-center px-5 py-2.5 text-slate-700 hover:text-slate-900 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50">
                  Features
                </Link>
                <button className="ml-1 text-slate-600 hover:text-slate-900 focus:outline-none group-hover:text-purple-600 transition-colors duration-200">
                  <ChevronDown size={16} className="transition-transform duration-200 group-hover:rotate-180" />
                </button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="absolute left-0 mt-2 w-[650px] rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-purple-100/50 transition-all duration-300 z-50 border border-gradient-to-r from-purple-100 to-blue-100">
              <div className="grid grid-cols-3 gap-8 p-8">
                <div>
                  <h4 className="font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text mb-4 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-purple-500" />
                    AI Generation
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/generate" className="text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center group">
                        <Code className="w-4 h-4 mr-2 text-purple-500 group-hover:text-purple-600" />
                        App Generator
                      </Link>
                    </li>
                    <li>
                      <Link href="/templates" className="text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center group">
                        <FileText className="w-4 h-4 mr-2 text-blue-500 group-hover:text-blue-600" />
                        Template Library
                      </Link>
                    </li>
                    <li>
                      <Link href="/ai-assistant" className="text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center group">
                        <Sparkles className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600" />
                        AI Assistant
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text mb-4 flex items-center">
                    <Palette className="w-4 h-4 mr-2 text-purple-500" />
                    Design Tools
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/visual-editor" className="text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center group">
                        <Eye className="w-4 h-4 mr-2 text-purple-500 group-hover:text-purple-600" />
                        Visual Editor
                      </Link>
                    </li>
                    <li>
                      <Link href="/components" className="text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center group">
                        <Monitor className="w-4 h-4 mr-2 text-blue-500 group-hover:text-blue-600" />
                        Component Library
                      </Link>
                    </li>
                    <li>
                      <Link href="/themes" className="text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center group">
                        <Sun className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600" />
                        Theme Builder
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text mb-4 flex items-center">
                    <Code className="w-4 h-4 mr-2 text-purple-500" />
                    Development
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/code-editor" className="text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center group">
                        <Code className="w-4 h-4 mr-2 text-purple-500 group-hover:text-purple-600" />
                        Code Editor
                      </Link>
                    </li>
                    <li>
                      <Link href="/preview" className="text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center group">
                        <Eye className="w-4 h-4 mr-2 text-blue-500 group-hover:text-blue-600" />
                        Live Preview
                      </Link>
                    </li>
                    <li>
                      <Link href="/export" className="text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center group">
                        <Download className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600" />
                        Export & Deploy
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link href="/blog" className="flex items-center px-5 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm">
            Blog
          </Link>
          <Link href="/pricing" className="flex items-center px-5 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm">
            Pricing
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 px-4 py-2 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 px-5 py-2.5 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50">
                Log in
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-xl shadow-purple-500/25 flex items-center space-x-2 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105">
                  <span className="font-semibold">Get Started</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
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
          className="lg:hidden p-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 border border-transparent hover:border-purple-100 hover:shadow-sm"
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
        className={`lg:hidden fixed inset-0 bg-gradient-to-br from-white/98 via-purple-50/95 to-blue-50/95 backdrop-blur-xl z-40 transform transition-transform ease-in-out duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ top: '70px' }}
      >
        <div className="px-6 py-8 h-full overflow-y-auto">
          <div className="flex flex-col space-y-3">
            <Link href="/dashboard" className="block px-5 py-3 text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm">
              Dashboard
            </Link>
            <Link href="/features" className="block px-5 py-3 text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm">
              Features
            </Link>
            <Link href="/templates" className="block px-5 py-3 text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm">
              Templates
            </Link>
            <Link href="/blog" className="block px-5 py-3 text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm">
              Blog
            </Link>
            <Link href="/projects" className="block px-5 py-3 text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm">
              Projects
            </Link>
            <Link href="/pricing" className="block px-5 py-3 text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-purple-100 hover:shadow-sm">
              Pricing
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-purple-100">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center px-5 py-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white text-sm font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full px-5 py-3 text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-300 font-medium border border-transparent hover:border-red-100 hover:shadow-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="w-full mb-4 border-purple-200 text-slate-600 py-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-300 transition-all duration-300">
                    Log in
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 py-3 flex items-center justify-center rounded-xl shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300">
                    <span className="font-semibold">Get Started</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-purple-100">
            <div className="flex items-center px-5 py-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-100">
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-3 rounded-xl mr-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Need help?</p>
                <Link href="mailto:support@bridgely.com" className="text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300">
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