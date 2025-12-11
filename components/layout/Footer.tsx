import React from 'react'
import Link from 'next/link'
import { RocketLaunchIcon } from '@heroicons/react/24/outline'

const navigation = {
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' }
  ],
  alternatives: [
    { name: 'SurferSEO', href: 'https://www.bridgely.io/blog/surferseo-vs-bridgely-2025-comparison' },
    { name: 'Jasper', href: 'https://www.bridgely.io/blog/bridgely-vs-jasper-which-is-better-for-ai-seo-blogging' },
    { name: 'Writesonic', href: 'https://www.bridgely.io/blog/bridgely-vs-writesonic-best-ai-seo-blog-tool-for-2025' },
    { name: 'Outrank', href: 'https://www.bridgely.io/blog/bridgely-vs-outrank-which-ranks-faster-in-2025' },
    { name: 'Copy.ai', href: 'https://www.bridgely.io/blog/bridgely-vs-copy-ai-best-ai-tool-for-long-form-seo-content' },
    { name: 'Frase', href: 'https://www.bridgely.io/blog/bridgely-vs-frase-which-produces-better-seo-content-briefs' },
    { name: 'RankPill', href: 'https://www.bridgely.io/blog/bridgely-vs-rankpill-which-ai-seo-article-tool-is-better' },
    { name: 'Rytr', href: 'https://www.bridgely.io/blog/bridgely-vs-rytr-which-ai-seo-writing-tool-is-better-for-long-form-content' },
    { name: 'Neuronwriter', href: 'https://www.bridgely.io/blog/bridgely-vs-neuronwriter-which-ai-seo-writing-tool-produces-better-seo-content-in-2025' },
  ]
}

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-16 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-6">
            <div className="flex items-center">
              <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-slate-900">
                Bridgely
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-600 max-w-sm">
              Rank on Google and get cited on ChatGPT – all in one place. 
              The ultimate SEO automation system for agencies and marketers.
            </p>
            <div className="flex space-x-5">
              <a href="https://www.facebook.com/bridgelyseo/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://www.instagram.com/bridgelyseo" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              <a href="mailto:team@bridgely.io" className="hover:text-slate-900 transition-colors">
                team@bridgely.io
              </a>
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-slate-900">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-slate-600 hover:text-slate-900 transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-slate-900">Alternatives</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.alternatives.map((item) => (
                    <li key={item.name}>
                      <a 
                        href={item.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm leading-6 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-200 pt-8 sm:mt-16 lg:mt-20">
          <p className="text-xs leading-5 text-slate-500">
            &copy; 2024 Bridgely. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}


