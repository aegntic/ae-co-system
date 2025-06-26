import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Star, Users, Building, TrendingUp, Quote } from 'lucide-react'

interface Testimonial {
  id: string
  author: string
  role: string
  company: string
  content: string
  avatar: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    author: 'Sarah Chen',
    role: 'Senior Developer',
    company: 'TechCorp',
    content: 'DailyDoco Pro transformed our documentation workflow. What used to take hours now takes minutes, and the quality is consistently professional.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: '2',
    author: 'Alex Rodriguez',
    role: 'Engineering Lead',
    company: 'StartupXYZ',
    content: 'The AI narration is incredibly accurate with technical terms. It understands our codebase better than some junior developers!',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  {
    id: '3',
    author: 'Marcus Johnson',
    role: 'DevOps Engineer',
    company: 'CloudScale',
    content: 'Privacy-first approach sold us. All processing happens locally, which meets our strict security requirements. Game changer.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus'
  }
]

export function SocialProof() {
  const [githubStars, setGithubStars] = useState(12534)
  const [animatedStars, setAnimatedStars] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  // Fetch real GitHub stars (simulated for demo)
  useEffect(() => {
    // In production, fetch from GitHub API
    // const fetchStars = async () => {
    //   const response = await fetch('https://api.github.com/repos/dailydoco/pro')
    //   const data = await response.json()
    //   setGithubStars(data.stargazers_count)
    // }
    // fetchStars()
  }, [])

  // Animate star count when in view
  useEffect(() => {
    if (isInView && animatedStars < githubStars) {
      const increment = Math.ceil(githubStars / 100)
      const timer = setTimeout(() => {
        setAnimatedStars(prev => Math.min(prev + increment, githubStars))
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [isInView, animatedStars, githubStars])

  return (
    <section ref={containerRef} className="py-24 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, var(--burnt-gold) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, var(--royal-purple) 0%, transparent 50%),
                           radial-gradient(circle at 40% 20%, var(--electric-blue) 0%, transparent 50%)`
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {/* GitHub Stars */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass rounded-2xl p-6 text-center group"
          >
            <Star className="w-8 h-8 text-burnt-gold mx-auto mb-3 group-hover:rotate-180 transition-transform duration-500" />
            <div className="text-3xl font-bold text-burnt-gold mb-1">
              {animatedStars.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">GitHub Stars</div>
          </motion.div>

          {/* Active Users */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass rounded-2xl p-6 text-center group"
          >
            <Users className="w-8 h-8 text-royal-purple mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <div className="text-3xl font-bold text-royal-purple mb-1">50K+</div>
            <div className="text-sm text-gray-400">Active Users</div>
          </motion.div>

          {/* Enterprise Customers */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass rounded-2xl p-6 text-center group"
          >
            <Building className="w-8 h-8 text-electric-blue mx-auto mb-3 group-hover:translate-y-1 transition-transform" />
            <div className="text-3xl font-bold text-electric-blue mb-1">500+</div>
            <div className="text-sm text-gray-400">Enterprise Teams</div>
          </motion.div>

          {/* Docs Created */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass rounded-2xl p-6 text-center group"
          >
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-3 group-hover:translate-x-1 transition-transform" />
            <div className="text-3xl font-bold text-green-500 mb-1">1M+</div>
            <div className="text-sm text-gray-400">Docs Created</div>
          </motion.div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by{' '}
            <span className="gradient-text">developers worldwide</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join thousands of teams who've revolutionized their documentation workflow
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="glass rounded-2xl p-6 relative group"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-white/10 group-hover:text-burnt-gold/20 transition-colors" />
              
              {/* Content */}
              <p className="text-gray-300 mb-6 leading-relaxed relative z-10">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full ring-2 ring-glass-border"
                />
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-gray-400">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-burnt-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Company Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-gray-500 mb-8">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            {['Google', 'Microsoft', 'Meta', 'Amazon', 'Apple'].map((company) => (
              <div key={company} className="text-2xl font-bold text-gray-400">
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}