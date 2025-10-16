'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { 
  Bars3Icon, 
  XMarkIcon,
  RocketLaunchIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  CalendarIcon,
  ChartBarIcon,
  PhotoIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

interface NavProps {
  className?: string
}

const navigation = [
  { name: 'Features', href: '#features', hasDropdown: true },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Dashboard', href: '/dashboard' },
]

const featureDropdown = [
  {
    category: 'Content Creation',
    items: [
      { name: 'AI Content Writer', href: '/content-writer', icon: PencilIcon },
      { name: 'AI SEO Editor', href: '/dashboard/editor', icon: WrenchScrewdriverIcon },
      { name: 'Image Search', href: '/image-search', icon: PhotoIcon },
    ]
  },
  {
    category: 'Automation',
    items: [
      { name: 'SEO Agent', href: '/dashboard/agent', icon: CogIcon },
      { name: 'Autoblog System', href: '/dashboard/autoblog', icon: CalendarIcon },
    ]
  },
  {
    category: 'Analytics',
    items: [
      { name: 'Analytics Dashboard', href: '/dashboard', icon: ChartBarIcon },
      { name: 'Competitive Analysis', href: '/competitive-analysis', icon: ChartBarIcon },
      { name: 'SEO Research', href: '/seo-research', icon: ChartBarIcon },
    ]
  }
]

export function Nav({ className }: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false)
  const pathname = usePathname()

  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setFeaturesDropdownOpen(!featuresDropdownOpen)
  }

  return (
    <nav className={cn("bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700", className)}>
      <div className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center group">
            <RocketLaunchIcon className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-200">
              SEOFlow
            </span>
          </Link>
        </div>
        
        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <div key={item.name} className="relative">
              {item.hasDropdown ? (
                <div className="relative">
                  <button
                    onClick={handleFeaturesClick}
                    className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                  >
                    {item.name}
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  
                  {/* Features Dropdown */}
                  {featuresDropdownOpen && (
                    <div className="absolute left-0 z-10 mt-2 w-[800px] origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                      <div className="p-6">
                        <div className="grid grid-cols-3 gap-8">
                          {featureDropdown.map((category) => (
                            <div key={category.category}>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                                {category.category}
                              </h3>
                              <ul className="space-y-3">
                                {category.items.map((feature) => (
                                  <li key={feature.name}>
                                    <Link
                                      href={feature.href}
                                      className="flex items-center gap-x-3 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors group"
                                    >
                                      <feature.icon className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                                      {feature.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm font-semibold leading-6 transition-colors",
                    pathname === item.href
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-900 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  )}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
        
        {/* Desktop CTA */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <Link href="/dashboard">
            <Button size="sm" variant="outline">
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-900 dark:ring-gray-700">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center">
                <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  SEOFlow
                </span>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10 dark:divide-gray-700">
                <div className="space-y-2 py-6">
                  <Link
                    href="#features"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="/pricing"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/dashboard"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </div>
                <div className="py-6 space-y-3">
                  <Link href="/dashboard" className="block">
                    <Button variant="outline" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="block">
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}