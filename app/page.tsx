import { Nav } from '@/components/Nav'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { 
  PencilSquareIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  ChartBarIcon,
  CheckIcon,
  StarIcon,
  ArrowRightIcon,
  CalendarIcon,
  ShareIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'AI SEO Editor',
    description: 'Edit and optimize existing content with intelligent suggestions and improvements.',
    icon: WrenchScrewdriverIcon,
    highlights: [
      'Smart content rewriting',
      'Keyword optimization',
      'Internal linking suggestions',
      'Image regeneration'
    ]
  },
  {
    name: 'SEO Agent',
    description: 'Automatically detect and fix SEO issues across your entire website.',
    icon: CogIcon,
    highlights: [
      'Issue detection & fixing',
      'Schema markup generation',
      'Meta tag optimization',
      'Internal linking structure'
    ]
  },
  {
    name: 'Autoblog System',
    description: 'Automated content generation from RSS feeds, news, and keyword monitoring.',
    icon: CalendarIcon,
    highlights: [
      'RSS feed integration',
      'Automated scheduling',
      'Social media syndication',
      'Google indexing optimization'
    ]
  },
  {
    name: 'Analytics Dashboard',
    description: 'Track performance, rankings, and ROI with comprehensive analytics.',
    icon: ChartBarIcon,
    highlights: [
      'Real-time performance tracking',
      'Ranking monitoring',
      'ROI calculations',
      'Client reporting'
    ]
  },
  {
    name: 'Multi-Platform Publishing',
    description: 'Publish to WordPress, custom CMS, and syndicate to social media automatically.',
    icon: ShareIcon,
    highlights: [
      'WordPress integration',
      'Custom CMS support',
      'Social media automation',
      'Cross-platform optimization'
    ]
  }
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for freelancers and small agencies',
    features: [
      '5 projects',
      '10,000 words/month',
      'Basic SEO analysis',
      'Email support',
      'WordPress integration'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    description: 'Ideal for growing agencies and teams',
    features: [
      '25 projects',
      '50,000 words/month',
      'Advanced SEO analysis',
      'Priority support',
      'All integrations',
      'Team collaboration',
      'Custom branding'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large agencies and enterprises',
    features: [
      'Unlimited projects',
      'Unlimited words',
      'White-label solution',
      'Dedicated support',
      'Custom integrations',
      'API access',
      'SLA guarantee'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'SEO Director',
    company: 'Digital Growth Agency',
    content: 'SEOFlow has revolutionized our content workflow. We\'ve seen a 300% increase in content output while maintaining quality.',
    rating: 5
  },
  {
    name: 'Mike Chen',
    role: 'Founder',
    company: 'TechStart Marketing',
    content: 'The AI SEO Agent alone has saved us 20 hours per week. Our clients are seeing better rankings and more traffic.',
    rating: 5
  },
  {
    name: 'Emily Rodriguez',
    role: 'Content Manager',
    company: 'ScaleUp Solutions',
    content: 'The multi-language support is incredible. We can now serve international clients without hiring translators.',
    rating: 5
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Nav />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-32 sm:pb-24 sm:pt-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <a href="#" className="inline-flex">
              <span className="rounded-full bg-blue-600/10 px-3 py-1 text-sm font-semibold leading-6 text-blue-600 ring-1 ring-inset ring-blue-600/10">
                New: ChatGPT Integration
              </span>
            </a>
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Rank Clients on Google and Get Cited on ChatGPT – In One Place
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              The ultimate SEO automation system for agencies and marketers. AI-powered content creation, optimization, and syndication that delivers results.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-4">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-4">
                  Get Started
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#demo" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                Watch Demo <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32" id="features">
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
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                    <p className="flex-auto">{feature.description}</p>
                    <ul className="mt-4 space-y-2">
                      {feature.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-center gap-x-2">
                          <CheckIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{highlight}</span>
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

      {/* Testimonials Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-24 sm:py-32">
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
                      </div>
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 sm:py-32" id="pricing">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Choose the right plan for your business
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-gray-300">
            Start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
            {pricingPlans.map((plan, planIdx) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-blue-600' : ''}`}>
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
                  <Link href="/dashboard" className="block">
                    <Button 
                      className={`mt-8 w-full ${plan.popular ? '' : 'variant-outline'}`}
                      variant={plan.popular ? 'primary' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
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
                  Get Started
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