import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, CheckIcon, LockClosedIcon, BarChartIcon, PersonIcon } from '@radix-ui/react-icons';
import { useWebSocket } from '@shared/hooks/useWebSocket';
import { cn } from '@/utils/cn';

const features = [
  {
    title: 'Enterprise-Grade Security',
    description: 'SOC2 Type II certified with advanced encryption and compliance',
    icon: LockClosedIcon,
  },
  {
    title: 'Advanced Analytics',
    description: 'Deep insights into documentation patterns and team productivity',
    icon: BarChartIcon,
  },
  {
    title: 'Team Management',
    description: 'Granular permissions, SSO, and centralized administration',
    icon: PersonIcon,
  },
];

const stats = [
  { label: 'Fortune 500 Companies', value: '87' },
  { label: 'Documents Created Daily', value: '250K+' },
  { label: 'Average Time Saved', value: '12 hrs/week' },
  { label: 'Enterprise Uptime', value: '99.99%' },
];

const testimonials = [
  {
    quote: "DailyDoco Pro transformed how our engineering teams document complex systems. The ROI was evident within weeks.",
    author: "Michael Torres",
    title: "CTO, Global Finance Corp",
    logo: "GFC",
  },
  {
    quote: "The enterprise features and compliance certifications made DailyDoco the clear choice for our organization.",
    author: "Lisa Wang",
    title: "VP Engineering, Healthcare Plus",
    logo: "H+",
  },
];

export default function LandingPage() {
  const { metrics } = useWebSocket();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  DailyDoco Pro
                </span>
                <span className="ml-2 text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                Features
              </a>
              <a href="#security" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                Security
              </a>
              <a href="#testimonials" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                Testimonials
              </a>
              <Link
                to="/dashboard"
                className="text-sm font-medium px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                View Demo
              </Link>
              <button className="text-sm font-medium px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Contact Sales
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></span>
              Trusted by 87 Fortune 500 Companies
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Enterprise Documentation
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-accent-purple bg-clip-text text-transparent">
                at Scale
              </span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Transform your organization's knowledge management with AI-powered documentation 
              that meets the highest standards of security, compliance, and performance.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
              >
                Request Enterprise Demo
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <button className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                Download Whitepaper
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Built for Enterprise Scale
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Features designed for the world's most demanding organizations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-purple rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-xl p-8 shadow-enterprise dark:shadow-enterprise-dark border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                  <feature.icon className="w-12 h-12 text-primary-600 mb-6" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                Security & Compliance First
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      SOC2 Type II Certified
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Annual audits ensure the highest security standards
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      GDPR & HIPAA Compliant
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Meet regulatory requirements across industries
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      End-to-End Encryption
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      AES-256 encryption for all data at rest and in transit
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      SSO & SAML Support
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Seamless integration with your identity providers
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-primary-600 to-accent-purple rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-8">Security Dashboard</h3>
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Encryption Status</span>
                      <span className="text-emerald-400">Active</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Compliance Score</span>
                      <span className="text-emerald-400">98%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: '98%' }}></div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Access Controls</span>
                      <span className="text-emerald-400">Enforced</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-full aspect-square bg-emerald-400/50 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 lg:px-8 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Trusted by Industry Leaders
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">
                    {testimonial.logo}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
                <blockquote className="text-lg text-slate-700 dark:text-slate-300 italic">
                  "{testimonial.quote}"
                </blockquote>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Ready to Transform Your Documentation?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Join leading enterprises in revolutionizing how teams create and share knowledge
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                Schedule Enterprise Demo
              </button>
              <button className="px-8 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Talk to Sales
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  DailyDoco Pro
                </span>
                <span className="ml-2 text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Security</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Terms of Service</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}