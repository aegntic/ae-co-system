import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useState } from 'react'
import { Menu, X, Github, Star } from 'lucide-react'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '#docs' },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'py-4' : 'py-6'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className={`glass rounded-2xl px-6 py-4 ${
            isScrolled ? 'backdrop-blur-2xl bg-glass/80' : ''
          }`}>
            <div className="flex items-center justify-between">
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-burnt-gold to-amber-600 flex items-center justify-center">
                  <span className="text-pure-black font-bold text-xl">D</span>
                </div>
                <span className="text-xl font-bold">DailyDoco Pro</span>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    whileHover={{ y: -2 }}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>

              {/* Desktop CTA */}
              <div className="hidden md:flex items-center gap-4">
                {/* GitHub Stars */}
                <motion.a
                  href="https://github.com/dailydoco/pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 glass rounded-xl hover:bg-glass-border transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <Star className="w-4 h-4 text-burnt-gold" />
                  <span className="text-sm font-medium">12.5k</span>
                </motion.a>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 bg-gradient-to-r from-burnt-gold to-amber-600 text-pure-black font-semibold rounded-xl"
                >
                  Get Started
                </motion.button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-glass-border rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{ 
          x: isMobileMenuOpen ? 0 : '100%',
          opacity: isMobileMenuOpen ? 1 : 0
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-40 md:hidden"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-pure-black/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Menu Content */}
        <div className="absolute right-0 top-0 h-full w-80 glass bg-pure-black/90 p-6 pt-24">
          <div className="space-y-6">
            {navLinks.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                whileHover={{ x: 10 }}
                className="block text-xl text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </motion.a>
            ))}
            
            <div className="pt-6 border-t border-glass-border">
              <button className="w-full btn-primary">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}