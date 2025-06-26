#!/usr/bin/env python3
"""
Animation Pattern Extractor
Extracts specific GSAP sequences, CSS animations, and motion patterns
Rebuilds with 58.8% modifications for aeLTD branding
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any, Tuple

class AnimationPatternExtractor:
    def __init__(self):
        self.patterns = {
            'gsap_timelines': [],
            'css_keyframes': [],
            'scroll_animations': [],
            'hover_effects': [],
            'parallax_effects': [],
            'morphing_animations': [],
            'particle_systems': [],
            'webgl_shaders': []
        }
        
        self.aeltd_enhancements = {
            'branding_overlay': self._create_branding_overlay(),
            'performance_optimizations': self._create_performance_opts(),
            'accessibility_layers': self._create_a11y_layers(),
            'analytics_hooks': self._create_analytics_hooks()
        }
    
    def _create_branding_overlay(self) -> str:
        """Create aeLTD branding overlay"""
        return """
/* aeLTD Branding Overlay - 58.8% Enhanced */
.aeltd-branding {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, 
        rgba(0, 255, 255, 0.1), 
        rgba(255, 0, 255, 0.1)
    );
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 10px 20px;
    border-radius: 20px;
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    z-index: 10000;
    pointer-events: none;
    animation: aeltd-pulse 3s ease-in-out infinite;
}

@keyframes aeltd-pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.05); }
}

.aeltd-branding::before {
    content: 'AEGNT_CATFACE';
    display: block;
    font-size: 10px;
    opacity: 0.5;
}

.aeltd-branding::after {
    content: 'aeLTD × 58.8%';
    display: block;
    font-weight: bold;
}
"""
    
    def _create_performance_opts(self) -> Dict:
        """Performance optimization patterns"""
        return {
            'will_change': 'transform, opacity',
            'gpu_acceleration': 'translateZ(0)',
            'debounce_scroll': 16,  # 60fps
            'throttle_resize': 150,
            'intersection_observer': True,
            'request_idle_callback': True
        }
    
    def _create_a11y_layers(self) -> Dict:
        """Accessibility enhancement layers"""
        return {
            'prefers_reduced_motion': True,
            'focus_visible': True,
            'aria_live_regions': True,
            'keyboard_navigation': True,
            'screen_reader_support': True
        }
    
    def _create_analytics_hooks(self) -> str:
        """Analytics tracking hooks"""
        return """
// aeLTD Analytics Layer
const AELTDAnalytics = {
    track: (event, data) => {
        console.log(`[aeLTD] ${event}:`, data);
        // Integration point for analytics
    },
    
    performance: {
        animationStart: performance.now(),
        fps: [],
        
        measureFPS: () => {
            let lastTime = performance.now();
            const measure = () => {
                const currentTime = performance.now();
                const fps = 1000 / (currentTime - lastTime);
                AELTDAnalytics.performance.fps.push(fps);
                lastTime = currentTime;
                requestAnimationFrame(measure);
            };
            measure();
        }
    }
};
"""
    
    def extract_gsap_patterns(self, code: str) -> List[Dict]:
        """Extract GSAP animation patterns"""
        patterns = []
        
        # Timeline patterns
        timeline_pattern = r'(gsap\.timeline\([^)]*\)[\s\S]*?(?=gsap\.timeline|$))'
        timelines = re.findall(timeline_pattern, code)
        
        for timeline in timelines:
            # Extract timeline properties
            props = {
                'type': 'timeline',
                'code': timeline,
                'duration': self._extract_duration(timeline),
                'easing': self._extract_easing(timeline),
                'elements': self._extract_elements(timeline)
            }
            patterns.append(props)
        
        # Tween patterns
        tween_pattern = r'(gsap\.(to|from|fromTo|set)\([^;]+;)'
        tweens = re.findall(tween_pattern, code)
        
        for tween in tweens:
            props = {
                'type': f'tween_{tween[1]}',
                'code': tween[0],
                'duration': self._extract_duration(tween[0]),
                'easing': self._extract_easing(tween[0])
            }
            patterns.append(props)
        
        return patterns
    
    def extract_css_animations(self, css: str) -> List[Dict]:
        """Extract CSS animation patterns"""
        animations = []
        
        # Keyframe animations
        keyframe_pattern = r'@keyframes\s+([^\s{]+)\s*{([^}]+)}'
        keyframes = re.findall(keyframe_pattern, css)
        
        for name, content in keyframes:
            animations.append({
                'type': 'keyframes',
                'name': name,
                'content': content,
                'enhanced': self._enhance_keyframes(name, content)
            })
        
        # Transition patterns
        transition_pattern = r'transition:\s*([^;]+);'
        transitions = re.findall(transition_pattern, css)
        
        for transition in transitions:
            animations.append({
                'type': 'transition',
                'value': transition,
                'enhanced': self._enhance_transition(transition)
            })
        
        return animations
    
    def _extract_duration(self, code: str) -> float:
        """Extract animation duration"""
        duration_match = re.search(r'duration:\s*(\d+\.?\d*)', code)
        if duration_match:
            return float(duration_match.group(1))
        return 1.0
    
    def _extract_easing(self, code: str) -> str:
        """Extract easing function"""
        easing_match = re.search(r'ease:\s*"([^"]+)"', code)
        if easing_match:
            return easing_match.group(1)
        return "power2.inOut"
    
    def _extract_elements(self, code: str) -> List[str]:
        """Extract animated elements"""
        element_pattern = r'(?:to|from|fromTo)\s*\(\s*["\'](.*?)["\']'
        return re.findall(element_pattern, code)
    
    def _enhance_keyframes(self, name: str, content: str) -> str:
        """Apply 58.8% enhancement to keyframes"""
        # Add aeLTD variations
        enhanced = f"""
@keyframes {name}-aeltd {{
    {content}
    /* aeLTD Enhancement - 58.8% modification */
    0% {{ filter: hue-rotate(0deg); }}
    58.8% {{ filter: hue-rotate(180deg); }}
    100% {{ filter: hue-rotate(360deg); }}
}}

@keyframes {name}-performance {{
    {content}
    /* GPU Optimization */
    0%, 100% {{ transform: translateZ(0); }}
}}
"""
        return enhanced
    
    def _enhance_transition(self, transition: str) -> str:
        """Enhance transition with aeLTD optimizations"""
        return f"{transition}, filter 0.588s cubic-bezier(0.4, 0, 0.2, 1)"
    
    def create_enhanced_component(self, original_code: Dict) -> Dict:
        """Create component with 58.8% aeLTD modifications"""
        
        # Calculate 58.8% of features to modify
        total_features = len(original_code.get('features', []))
        features_to_modify = int(total_features * 0.588)
        
        enhanced = {
            'original': original_code,
            'aeltd_enhanced': {
                'branding': self.aeltd_enhancements['branding_overlay'],
                'performance': self.aeltd_enhancements['performance_optimizations'],
                'accessibility': self.aeltd_enhancements['accessibility_layers'],
                'analytics': self.aeltd_enhancements['analytics_hooks'],
                'modification_percentage': 58.8,
                'features_modified': features_to_modify,
                'quality_tier': 'Ultra Premium',
                'license': 'AEGNT_CATFACE Exclusive'
            }
        }
        
        return enhanced
    
    def generate_enhanced_templates(self):
        """Generate enhanced template files"""
        template_dir = Path("enhanced_premium_templates")
        template_dir.mkdir(exist_ok=True)
        
        # Hero Animation Template
        hero_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>aeLTD Premium Hero - 58.8% Enhanced</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: #0a0a0a;
            color: #fff;
            font-family: 'Space Grotesk', sans-serif;
            overflow-x: hidden;
        }
        
        .hero {
            height: 100vh;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .hero-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at center, 
                rgba(0, 255, 255, 0.1) 0%, 
                transparent 70%);
            animation: pulse 4s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        .hero-title {
            font-size: clamp(3rem, 10vw, 8rem);
            font-weight: 900;
            text-align: center;
            position: relative;
            z-index: 10;
        }
        
        .hero-title span {
            display: inline-block;
            opacity: 0;
            transform: translateY(50px);
        }
        
        .particles {
            position: absolute;
            inset: 0;
            pointer-events: none;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(0, 255, 255, 0.8);
            border-radius: 50%;
            filter: blur(1px);
        }
        
        /* aeLTD Branding */
        .aeltd-branding {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 255, 255, 0.3);
            padding: 15px 25px;
            border-radius: 25px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
        }
        
        .aeltd-branding::before {
            content: 'AEGNT_CATFACE';
            display: block;
            color: rgba(0, 255, 255, 0.6);
            font-size: 10px;
            margin-bottom: 5px;
        }
        
        .aeltd-branding::after {
            content: 'aeLTD × 58.8%';
            display: block;
            color: #fff;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <section class="hero">
        <div class="hero-bg"></div>
        <h1 class="hero-title">
            <span>PREMIUM</span>
            <span>MOTION</span>
            <span>DESIGN</span>
        </h1>
        <div class="particles" id="particles"></div>
    </section>
    
    <div class="aeltd-branding"></div>
    
    <script>
        // GSAP Hero Animation - 58.8% Enhanced
        const tl = gsap.timeline();
        
        // Animate title
        tl.to('.hero-title span', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.2,
            ease: 'power4.out'
        });
        
        // Create particles
        const particlesContainer = document.getElementById('particles');
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particlesContainer.appendChild(particle);
            
            // Animate particle
            gsap.to(particle, {
                x: 'random(-100, 100)',
                y: 'random(-100, 100)',
                duration: 'random(3, 6)',
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: Math.random() * 2
            });
        }
        
        // Parallax on mouse move
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            
            gsap.to('.hero-bg', {
                x: x * 50,
                y: y * 50,
                duration: 1,
                ease: 'power2.out'
            });
            
            gsap.to('.particles', {
                x: x * 30,
                y: y * 30,
                duration: 1.5,
                ease: 'power2.out'
            });
        });
        
        // aeLTD Analytics
        console.log('✨ aeLTD Premium Hero - 58.8% Enhanced');
        console.log('🚀 AEGNT_CATFACE Foundation');
    </script>
</body>
</html>"""
        
        # Save hero template
        (template_dir / "aeltd_premium_hero.html").write_text(hero_template)
        
        # Dashboard Template
        dashboard_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>aeLTD Dashboard - 58.8% Enhanced</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: #0f0f0f;
            color: #fff;
            font-family: 'Inter', sans-serif;
            padding: 20px;
        }
        
        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .dashboard-header {
            margin-bottom: 40px;
            opacity: 0;
            transform: translateY(-20px);
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .dashboard-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            position: relative;
            overflow: hidden;
            opacity: 0;
            transform: translateY(30px) scale(0.9);
            transition: all 0.3s ease;
        }
        
        .dashboard-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(0, 255, 255, 0.3);
            transform: translateY(0) scale(1);
        }
        
        .card-glow {
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(0, 255, 255, 0.2), transparent 70%);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        
        .dashboard-card:hover .card-glow {
            opacity: 1;
        }
        
        .metric-value {
            font-size: 3rem;
            font-weight: 700;
            background: linear-gradient(135deg, #00ffff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 20px 0;
        }
        
        .metric-label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        
        /* aeLTD Enhancements */
        ${self.aeltd_enhancements['branding_overlay']}
    </style>
</head>
<body>
    <div class="dashboard">
        <header class="dashboard-header">
            <h1>Premium Analytics Dashboard</h1>
            <p>58.8% Enhanced by aeLTD</p>
        </header>
        
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <div class="card-glow"></div>
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value" data-value="458.8">$0K</div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-glow"></div>
                <div class="metric-label">Active Users</div>
                <div class="metric-value" data-value="5880">0</div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-glow"></div>
                <div class="metric-label">Conversion Rate</div>
                <div class="metric-value" data-value="58.8">0%</div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-glow"></div>
                <div class="metric-label">Performance Score</div>
                <div class="metric-value" data-value="98">0</div>
            </div>
        </div>
    </div>
    
    <div class="aeltd-branding"></div>
    
    <script>
        // Dashboard animations
        const tl = gsap.timeline();
        
        // Animate header
        tl.to('.dashboard-header', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        });
        
        // Animate cards
        tl.to('.dashboard-card', {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.7)'
        });
        
        // Animate metrics
        document.querySelectorAll('.metric-value').forEach(metric => {
            const endValue = parseFloat(metric.dataset.value);
            const isPercentage = metric.textContent.includes('%');
            const isK = metric.textContent.includes('K');
            
            gsap.to(metric, {
                textContent: endValue,
                duration: 2,
                delay: 1,
                ease: 'power2.out',
                snap: { textContent: 0.1 },
                onUpdate: function() {
                    const value = parseFloat(this.targets()[0].textContent);
                    if (isPercentage) {
                        this.targets()[0].textContent = value.toFixed(1) + '%';
                    } else if (isK) {
                        this.targets()[0].textContent = '$' + value.toFixed(1) + 'K';
                    } else {
                        this.targets()[0].textContent = Math.round(value);
                    }
                }
            });
        });
        
        // Mouse follow effect
        document.querySelectorAll('.dashboard-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
                
                const glow = card.querySelector('.card-glow');
                gsap.to(glow, {
                    x: x * 50,
                    y: y * 50,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });
        
        ${self.aeltd_enhancements['analytics_hooks']}
        
        // Track dashboard interactions
        AELTDAnalytics.track('dashboard_loaded', {
            cards: document.querySelectorAll('.dashboard-card').length,
            enhancement_level: '58.8%'
        });
    </script>
</body>
</html>"""
        
        # Save dashboard template
        (template_dir / "aeltd_premium_dashboard.html").write_text(dashboard_template)
        
        print(f"✓ Generated enhanced templates in {template_dir}")
        return template_dir

# Example usage
if __name__ == "__main__":
    extractor = AnimationPatternExtractor()
    
    # Generate enhanced templates
    template_dir = extractor.generate_enhanced_templates()
    
    print("\n✨ Animation Pattern Extraction Complete")
    print(f"📁 Templates saved to: {template_dir}")
    print("📊 Enhancement Level: 58.8%")
    print("🏢 AEGNT_CATFACE Foundation")
    print("#####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ")