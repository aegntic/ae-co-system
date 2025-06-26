#!/usr/bin/env python3
"""
Premium Templates Database Builder
Mattae Cooper's Curated Collection
"""

import json
from datetime import datetime

# Build the premium templates database with only the finest
PREMIUM_TEMPLATES_DB = {
    "metadata": {
        "curator": "Mattae Cooper",
        "version": "1.0.0",
        "last_updated": datetime.now().isoformat(),
        "total_templates": 12,
        "quality_guarantee": "Every template hand-picked for excellence"
    },
    "templates": [
        {
            "id": "ethereal-portfolio-x",
            "title": "Ethereal Portfolio X", 
            "author": "Cosmic Designs",
            "price": 149,
            "category": "Portfolio",
            "features": [
                "Smooth Scroll", "Lenis", "SplitType", 
                "Custom Cursors", "Magnetic Buttons", "Scroll-triggered Animations"
            ],
            "tech_stack": ["React", "GSAP", "Three.js", "Lenis", "SplitType"],
            "design_style": "Minimalist Luxury",
            "preview_url": "https://ethereal-portfolio.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/ethereal-portfolio-x",
            "performance_score": 96,
            "mattae_rating": 8,
            "description": "Ultra-smooth portfolio with magnetic interactions and split-text animations"
        },
        {
            "id": "quantum-interface-pro",
            "title": "Quantum Interface Pro",
            "author": "Studio Disruptive", 
            "price": 289,
            "category": "Creative Agency",
            "features": [
                "WebGL", "GSAP", "Three.js", "Particle Systems",
                "Custom Shaders", "Post-processing Effects"
            ],
            "tech_stack": ["Next.js", "Three.js", "GLSL", "GSAP", "React Three Fiber"],
            "design_style": "Quantum Interface",
            "preview_url": "https://quantum-interface.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/quantum-interface-pro",
            "performance_score": 94,
            "mattae_rating": 9,
            "description": "Next-gen agency template with custom WebGL shaders and particle physics"
        },
        {
            "id": "liquid-metal-commerce",
            "title": "Liquid Metal Commerce",
            "author": "Fluid Dynamics Studio",
            "price": 399,
            "category": "E-commerce",
            "features": [
                "Liquid Metal Effects", "WebGL", "Three.js",
                "AR Product Views", "AI Recommendations", "Real-time 3D"
            ],
            "tech_stack": ["Vue 3", "Three.js", "TensorFlow.js", "WebXR", "GSAP"],
            "design_style": "Liquid Metal",
            "preview_url": "https://liquid-metal.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/liquid-metal-commerce",
            "performance_score": 92,
            "mattae_rating": 10,
            "description": "Revolutionary e-commerce with liquid metal transitions and AR integration"
        },
        {
            "id": "dimensional-dashboard",
            "title": "Dimensional Dashboard",
            "author": "4D Design Lab",
            "price": 259,
            "category": "Dashboard",
            "features": [
                "4D Data Visualization", "WebGL", "D3.js",
                "Real-time Updates", "Custom Cursors", "Depth Layers"
            ],
            "tech_stack": ["React", "D3.js", "Three.js", "WebSocket", "Framer Motion"],
            "design_style": "Dimensional Layers",
            "preview_url": "https://dimensional.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/dimensional-dashboard",
            "performance_score": 95,
            "mattae_rating": 9,
            "description": "Multi-dimensional dashboard with depth-based data visualization"
        },
        {
            "id": "neo-brutalist-banking",
            "title": "Neo-Brutalist Banking Elite",
            "author": "Concrete Digital",
            "price": 189,
            "category": "Financial",
            "features": [
                "Bold Typography", "Asymmetric Grids", "Micro-interactions",
                "GSAP", "Custom Cursors", "Noise Textures"
            ],
            "tech_stack": ["Nuxt 3", "GSAP", "Three.js", "Pinia", "TypeScript"],
            "design_style": "Neo-Brutalism",
            "preview_url": "https://brutalist-banking.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/neo-brutalist-banking",
            "performance_score": 97,
            "mattae_rating": 8,
            "description": "Brutalist banking interface with concrete textures and bold interactions"
        },
        {
            "id": "organic-flow-studio",
            "title": "Organic Flow Studio",
            "author": "Nature Morphics",
            "price": 169,
            "category": "Creative Studio",
            "features": [
                "SVG Morphing", "Organic Shapes", "Fluid Animations",
                "GSAP", "Smooth Scroll", "Nature-inspired Transitions"
            ],
            "tech_stack": ["SvelteKit", "GSAP", "Three.js", "Lenis", "Matter.js"],
            "design_style": "Organic Design",
            "preview_url": "https://organic-flow.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/organic-flow-studio",
            "performance_score": 93,
            "mattae_rating": 7,
            "description": "Nature-inspired studio template with organic morphing animations"
        },
        {
            "id": "glass-morphism-ultimate",
            "title": "Glassmorphism Ultimate 2025",
            "author": "Crystal Clear Design",
            "price": 129,
            "category": "Multi-purpose",
            "features": [
                "Advanced Glass Effects", "Backdrop Filters", "Frosted Glass",
                "Custom Cursors", "Smooth Scroll", "Light Refraction"
            ],
            "tech_stack": ["React", "GSAP", "CSS Houdini", "Framer Motion", "Vite"],
            "design_style": "Glassmorphism",
            "preview_url": "https://glass-ultimate.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/glass-morphism-ultimate",
            "performance_score": 91,
            "mattae_rating": 8,
            "description": "The definitive glassmorphism template with light refraction physics"
        },
        {
            "id": "ai-powered-portfolio",
            "title": "AI-Powered Portfolio Pro",
            "author": "Neural Networks Studio",
            "price": 299,
            "category": "Portfolio",
            "features": [
                "AI Content Generation", "Voice Navigation", "Gesture Control",
                "WebGL", "Three.js", "TensorFlow.js Integration"
            ],
            "tech_stack": ["Next.js", "Three.js", "TensorFlow.js", "OpenAI API", "Vercel AI"],
            "design_style": "Futuristic",
            "preview_url": "https://ai-portfolio.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/ai-powered-portfolio",
            "performance_score": 94,
            "mattae_rating": 9,
            "description": "AI-enhanced portfolio that adapts to visitor behavior in real-time"
        },
        {
            "id": "minimalist-luxury-agency",
            "title": "Minimalist Luxury Agency",
            "author": "Less is More Studio",
            "price": 219,
            "category": "Agency",
            "features": [
                "Extreme Minimalism", "Premium Typography", "Subtle Animations",
                "Custom Cursors", "Smooth Scroll", "White Space Mastery"
            ],
            "tech_stack": ["Astro", "GSAP", "Lenis", "SplitType", "Tailwind CSS"],
            "design_style": "Minimalist Luxury",
            "preview_url": "https://minimal-luxury.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/minimalist-luxury-agency",
            "performance_score": 98,
            "mattae_rating": 9,
            "description": "Luxury minimalism with perfect typography and subtle interactions"
        },
        {
            "id": "cyberpunk-commerce",
            "title": "Cyberpunk Commerce 2077",
            "author": "Neon Dreams Studio",
            "price": 189,
            "category": "E-commerce",
            "features": [
                "Neon Glow Effects", "Glitch Animations", "Holographic UI",
                "WebGL", "Custom Shaders", "Cyberpunk Aesthetics"
            ],
            "tech_stack": ["Vue 3", "Three.js", "GSAP", "Pinia", "WebGL Shaders"],
            "design_style": "Tech Minimalism",
            "preview_url": "https://cyberpunk-commerce.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/cyberpunk-commerce",
            "performance_score": 92,
            "mattae_rating": 8,
            "description": "Futuristic e-commerce with neon aesthetics and holographic effects"
        },
        {
            "id": "motion-design-system",
            "title": "Motion Design System Pro",
            "author": "Kinetic Type Studio",
            "price": 349,
            "category": "Design System",
            "features": [
                "200+ Animations", "Motion Principles", "Interactive Playground",
                "GSAP", "Lottie", "Custom Easings", "Animation Library"
            ],
            "tech_stack": ["React", "GSAP", "Framer Motion", "Lottie", "Storybook"],
            "design_style": "Futuristic",
            "preview_url": "https://motion-system.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/motion-design-system",
            "performance_score": 96,
            "mattae_rating": 10,
            "description": "Complete motion design system with 200+ production-ready animations"
        },
        {
            "id": "blockchain-fintech",
            "title": "Blockchain Fintech Ultimate",
            "author": "Crypto Interface Lab",
            "price": 429,
            "category": "Financial",
            "features": [
                "Web3 Integration", "Real-time Charts", "Blockchain Visualizations",
                "WebGL", "D3.js", "Custom Cursors", "DeFi Components"
            ],
            "tech_stack": ["Next.js", "Web3.js", "Three.js", "D3.js", "Chart.js"],
            "design_style": "Tech Minimalism",
            "preview_url": "https://blockchain-fintech.preview.4site.pro",
            "purchase_url": "https://premium.4site.pro/blockchain-fintech",
            "performance_score": 93,
            "mattae_rating": 9,
            "description": "Ultimate fintech template with Web3 integration and blockchain visualizations"
        }
    ]
}

# Save the database
with open("mattae_premium_collection.json", "w") as f:
    json.dump(PREMIUM_TEMPLATES_DB, f, indent=2)

# Generate statistics
print("📊 Mattae's Premium Collection Statistics")
print("=" * 50)
print(f"Total Templates: {len(PREMIUM_TEMPLATES_DB['templates'])}")
print(f"Average Price: ${sum(t['price'] for t in PREMIUM_TEMPLATES_DB['templates']) / len(PREMIUM_TEMPLATES_DB['templates']):.2f}")
print(f"Price Range: ${min(t['price'] for t in PREMIUM_TEMPLATES_DB['templates'])} - ${max(t['price'] for t in PREMIUM_TEMPLATES_DB['templates'])}")

# Rating distribution
ratings = {}
for template in PREMIUM_TEMPLATES_DB['templates']:
    rating = template['mattae_rating']
    ratings[rating] = ratings.get(rating, 0) + 1

print("\nRating Distribution:")
for rating in sorted(ratings.keys(), reverse=True):
    print(f"  {rating}/10: {'⭐' * ratings[rating]} ({ratings[rating]} templates)")

# Category distribution
categories = {}
for template in PREMIUM_TEMPLATES_DB['templates']:
    cat = template['category']
    categories[cat] = categories.get(cat, 0) + 1

print("\nCategory Distribution:")
for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
    print(f"  {cat}: {count}")

print("\n✨ Database saved to mattae_premium_collection.json")
print("#####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ")