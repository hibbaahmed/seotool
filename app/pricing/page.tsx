import { Nav } from '@/components/Nav'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import ContentGenerator from '@/components/ContentGenerator'
import Link from 'next/link'
import { 
  CheckIcon,
  StarIcon,
  ArrowRightIcon,
  RocketLaunchIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  CalendarIcon,
  ChartBarIcon,
  ShareIcon,
  UsersIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const pricingPlans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for freelancers and small agencies',
    popular: false,
    features: [
      '5 projects',
      '10,000 words/month',
      'Basic SEO analysis',
      'Email support',
      'WordPress integration',
      '1 user account',
      'Basic analytics'
    ],
    cta: 'Start Free Trial',
    href: '/dashboard'
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    description: 'Ideal for growing agencies and teams',
    popular: true,
    features: [
      '25 projects',
      '50,000 words/month',
      'Advanced SEO analysis',
      'Priority support',
      'All integrations',
      'Team collaboration (up to 5 users)',
      'Custom branding',
      'Advanced analytics',
      'API access',
      'White-label reports'
    ],
    cta: 'Start Free Trial',
    href: '/dashboard'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large agencies and enterprises',
    popular: false,
    features: [
      'Unlimited projects',
      'Unlimited words',
      'White-label solution',
      'Dedicated support',
      'Custom integrations',
      'Unlimited users',
      'SLA guarantee',
      'Custom training',
      'On-premise deployment',
      'Advanced security'
    ],
    cta: 'Contact Sales',
    href: '/contact'
  }
]

const features = [
  {
    category: 'Content Creation',
    icon: PencilSquareIcon,
    items: [
      'AI-powered content generation',
      'Multi-language support (150+ languages)',
      'Brand voice customization',
      'SEO-optimized structure',
      'Auto-publishing to CMS'
    ]
  },
  {
    category: 'SEO Optimization',
    icon: CogIcon,
    items: [
      'Automated SEO issue detection',
      'Schema markup generation',
      'Meta tag optimization',
      'Internal linking suggestions',
      'Keyword research & tracking'
    ]
  },
  {
    category: 'Analytics & Reporting',
    icon: ChartBarIcon,
    items: [
      'Real-time performance tracking',
      'Ranking monitoring',
      'ROI calculations',
      'Client reporting dashboards',
      'Competitor analysis'
    ]
  },
  {
    category: 'Automation',
    icon: CalendarIcon,
    items: [
      'RSS feed integration',
      'Automated scheduling',
      'Social media syndication',
      'Google indexing optimization',
      'Workflow automation'
    ]
  },
  {
    category: 'Integrations',
    icon: ShareIcon,
    items: [
      'WordPress integration',
      'Custom CMS support',
      'Social media automation',
      'API access',
      'Webhook support'
    ]
  },
  {
    category: 'Support',
    icon: UsersIcon,
    items: [
      '24/7 email support',
      'Priority support (Pro+)',
      'Dedicated account manager (Enterprise)',
      'Custom training sessions',
      'Documentation & tutorials'
    ]
  }
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'SEO Director',
    company: 'Digital Growth Agency',
    content: 'SEOFlow has revolutionized our content workflow. We\'ve seen a 300% increase in content output while maintaining quality.',
    rating: 5,
    plan: 'Professional'
  },
  {
    name: 'Mike Chen',
    role: 'Founder',
    company: 'TechStart Marketing',
    content: 'The AI SEO Agent alone has saved us 20 hours per week. Our clients are seeing better rankings and more traffic.',
    rating: 5,
    plan: 'Professional'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Content Manager',
    company: 'ScaleUp Solutions',
    content: 'The multi-language support is incredible. We can now serve international clients without hiring translators.',
    rating: 5,
    plan: 'Enterprise'
  }
]

const faqs = [
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All plans come with a 14-day free trial. No credit card required to start.'
  },
  {
    question: 'Can I change plans anytime?',
    answer: 'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
  },
  {
    question: 'What happens if I exceed my word limit?',
    answer: 'We\'ll notify you when you\'re approaching your limit. You can upgrade your plan or purchase additional credits.'
  },
  {
    question: 'Do you offer custom integrations?',
    answer: 'Yes, custom integrations are available for Professional and Enterprise plans. Contact us to discuss your needs.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade security with SSL encryption, regular backups, and SOC 2 compliance.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.'
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Nav />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-32 sm:pb-24 sm:pt-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              Choose the perfect plan for your SEO automation needs. Start with a 14-day free trial.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-4">
              <div className="flex items-center gap-x-2">
                <CheckIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">14-day free trial</span>
              </div>
              <div className="flex items-center gap-x-2">
                <CheckIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">No credit card required</span>
              </div>
              <div className="flex items-center gap-x-2">
                <CheckIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="isolate mx-auto grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
            {pricingPlans.map((plan, planIdx) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-blue-600 shadow-xl' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-lg font-semibold leading-7 text-gray-600 dark:text-gray-300">
                      {plan.period}
                    </span>
                  </div>
                  <CardDescription className="mt-4">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul role="list" className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-500" aria-hidden="true" />
                        <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="block">
                    <Button 
                      className="mt-8 w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 dark:bg-gray-800 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Complete SEO automation in one platform
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              From content creation to ranking optimization, SEOFlow handles every aspect of your SEO workflow.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.category} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                    {feature.category}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                    <ul className="space-y-2">
                      {feature.items.map((item) => (
                        <li key={item} className="flex items-center gap-x-2">
                          <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-lg font-semibold leading-8 tracking-tight text-blue-600">Testimonials</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Trusted by 500+ agencies worldwide
            </p>
          </div>
          <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
            <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
              {testimonials.map((testimonial, testimonialIdx) => (
                <div key={testimonialIdx} className="pt-8 sm:inline-block sm:w-full sm:px-4">
                  <figure className="rounded-2xl bg-white p-8 text-sm leading-6 shadow-lg ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-gray-700">
                    <blockquote className="text-gray-900 dark:text-white">
                      <p>"{testimonial.content}"</p>
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-x-4">
                      <div className="flex items-center">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                        <div className="text-gray-600 dark:text-gray-400">{testimonial.role}, {testimonial.company}</div>
                        <div className="text-xs text-blue-600">{testimonial.plan} Plan</div>
                      </div>
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">FAQ</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Frequently asked questions
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl">
            <dl className="space-y-8">
              {faqs.map((faq, faqIdx) => (
                <div key={faqIdx} className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
                  <dt className="text-lg font-semibold leading-7 text-gray-900 dark:text-white">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Try it yourself</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Experience AI-powered content generation
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Test our AI agents before committing. Generate content, research keywords, or analyze competitors.
            </p>
          </div>
          <ContentGenerator />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your SEO workflow?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join thousands of agencies already using SEOFlow to rank clients and get cited on ChatGPT.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                  Start Free Trial
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#contact" className="text-sm font-semibold leading-6 text-white">
                Contact Sales <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
