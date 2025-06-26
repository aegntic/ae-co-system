import { useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Flip from 'gsap/Flip';
import { useComponentPerformance } from './usePerformance';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, Flip);
}

interface GSAPAnimationOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number | object;
  repeat?: number;
  yoyo?: boolean;
  autoAlpha?: number;
  onComplete?: () => void;
  onStart?: () => void;
  onUpdate?: () => void;
}

interface ScrollTriggerOptions {
  trigger?: string | Element;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
}

/**
 * Core GSAP hook for React integration
 * Provides advanced animations beyond Framer Motion capabilities
 */
export const useGSAP = () => {
  const animations = useRef<gsap.core.Tween[]>([]);
  const timelines = useRef<gsap.core.Timeline[]>([]);
  const metrics = useComponentPerformance('useGSAP');

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      animations.current.forEach(anim => anim.kill());
      timelines.current.forEach(tl => tl.kill());
      animations.current = [];
      timelines.current = [];
    };
  }, []);

  // Basic animation methods
  const animateTo = useCallback((target: gsap.TweenTarget, vars: gsap.TweenVars & GSAPAnimationOptions) => {
    const startTime = performance.now();
    const tween = gsap.to(target, {
      ...vars,
      onComplete: () => {
        const animTime = performance.now() - startTime;
        console.log(`[GSAP Performance] Animation completed in ${animTime.toFixed(2)}ms`);
        vars.onComplete?.();
      }
    });
    animations.current.push(tween);
    return tween;
  }, []);

  const animateFrom = useCallback((target: gsap.TweenTarget, vars: gsap.TweenVars & GSAPAnimationOptions) => {
    const tween = gsap.from(target, vars);
    animations.current.push(tween);
    return tween;
  }, []);

  const animateFromTo = useCallback((target: gsap.TweenTarget, fromVars: gsap.TweenVars, toVars: gsap.TweenVars & GSAPAnimationOptions) => {
    const tween = gsap.fromTo(target, fromVars, toVars);
    animations.current.push(tween);
    return tween;
  }, []);

  const setProperties = useCallback((target: gsap.TweenTarget, vars: gsap.TweenVars) => {
    return gsap.set(target, vars);
  }, []);

  // Timeline creation
  const createTimeline = useCallback((vars?: gsap.TimelineVars) => {
    const timeline = gsap.timeline(vars);
    timelines.current.push(timeline);
    return timeline;
  }, []);

  // Kill specific animations
  const killAnimations = useCallback((target?: gsap.TweenTarget) => {
    if (target) {
      gsap.killTweensOf(target);
    } else {
      animations.current.forEach(anim => anim.kill());
      animations.current = [];
    }
  }, []);

  return {
    animateTo,
    animateFrom,
    animateFromTo,
    setProperties,
    createTimeline,
    killAnimations,
    gsap,
    metrics
  };
};

/**
 * Hook for entrance animations with performance optimization
 */
export const useGSAPEntrance = (trigger: 'onMount' | 'onView' = 'onMount', options: GSAPAnimationOptions = {}) => {
  const elementRef = useRef<HTMLElement>(null);
  const { animateFrom } = useGSAP();
  const hasAnimated = useRef(false);

  const defaultOptions: GSAPAnimationOptions = {
    duration: 0.8,
    ease: 'power2.out',
    ...options
  };

  const triggerAnimation = useCallback(() => {
    if (!elementRef.current || hasAnimated.current) return;
    
    hasAnimated.current = true;
    animateFrom(elementRef.current, {
      y: 50,
      opacity: 0,
      scale: 0.9,
      ...defaultOptions
    });
  }, [animateFrom, defaultOptions]);

  useLayoutEffect(() => {
    if (trigger === 'onMount') {
      triggerAnimation();
    }
  }, [trigger, triggerAnimation]);

  // Intersection Observer for 'onView' trigger
  useEffect(() => {
    if (trigger !== 'onView' || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          triggerAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [trigger, triggerAnimation]);

  return { elementRef, triggerAnimation };
};

/**
 * Hook for scroll-triggered animations
 */
export const useGSAPScrollTrigger = (options: ScrollTriggerOptions & GSAPAnimationOptions = {}) => {
  const elementRef = useRef<HTMLElement>(null);
  const { animateTo } = useGSAP();
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useLayoutEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    
    // Create scroll-triggered animation
    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: element,
      start: 'top 80%',
      end: 'bottom 20%',
      ...options,
      onEnter: () => {
        animateTo(element, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          ...options
        });
        options.onEnter?.();
      }
    });

    return () => {
      scrollTriggerRef.current?.kill();
    };
  }, [animateTo, options]);

  return { elementRef };
};

/**
 * Hook for advanced text animations
 */
export const useGSAPTextAnimation = (type: 'typewriter' | 'reveal' | 'split' = 'reveal') => {
  const textRef = useRef<HTMLElement>(null);
  const { animateFrom, createTimeline } = useGSAP();

  const animateText = useCallback(() => {
    if (!textRef.current) return;

    const element = textRef.current;
    const text = element.textContent || '';
    
    switch (type) {
      case 'typewriter':
        element.textContent = '';
        const timeline = createTimeline();
        
        text.split('').forEach((char, index) => {
          timeline.add(() => {
            element.textContent += char;
          }, index * 0.05);
        });
        break;

      case 'reveal':
        element.style.overflow = 'hidden';
        animateFrom(element, {
          y: '100%',
          duration: 0.8,
          ease: 'power2.out'
        });
        break;

      case 'split':
        const chars = text.split('').map((char, index) => {
          const span = document.createElement('span');
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.style.display = 'inline-block';
          return span;
        });
        
        element.innerHTML = '';
        chars.forEach(char => element.appendChild(char));
        
        animateFrom(chars, {
          y: 50,
          opacity: 0,
          duration: 0.6,
          stagger: 0.02,
          ease: 'power2.out'
        });
        break;
    }
  }, [type, animateFrom, createTimeline]);

  return { textRef, animateText };
};

/**
 * Hook for magnetic hover effects
 */
export const useGSAPMagnetic = (strength: number = 0.3) => {
  const elementRef = useRef<HTMLElement>(null);
  const { animateTo, setProperties } = useGSAP();

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;
      
      animateTo(element, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      animateTo(element, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength, animateTo]);

  return { elementRef };
};

/**
 * Hook for morphing animations using FLIP
 */
export const useGSAPMorph = () => {
  const { animateFrom } = useGSAP();

  const morphBetween = useCallback((fromElement: Element, toElement: Element, options: GSAPAnimationOptions = {}) => {
    const state = Flip.getState([fromElement, toElement]);
    
    // Perform DOM changes here (swap classes, positions, etc.)
    
    return Flip.from(state, {
      duration: 0.8,
      ease: 'power2.inOut',
      ...options
    });
  }, []);

  const morphLayout = useCallback((selector: string, callback: () => void, options: GSAPAnimationOptions = {}) => {
    const state = Flip.getState(selector);
    
    callback(); // DOM changes
    
    return Flip.from(state, {
      duration: 0.6,
      ease: 'power2.inOut',
      stagger: 0.05,
      ...options
    });
  }, []);

  return { morphBetween, morphLayout };
};

/**
 * Hook for performance-optimized batch animations
 */
export const useGSAPBatch = () => {
  const { createTimeline } = useGSAP();
  
  const batchAnimate = useCallback((animations: Array<{
    target: gsap.TweenTarget;
    vars: gsap.TweenVars;
    position?: string | number;
  }>) => {
    const timeline = createTimeline();
    
    animations.forEach(({ target, vars, position }) => {
      timeline.to(target, vars, position);
    });
    
    return timeline;
  }, [createTimeline]);

  return { batchAnimate };
};

/**
 * Master hook combining multiple GSAP features
 */
export const useGSAPMaster = () => {
  const gsapCore = useGSAP();
  const entrance = useGSAPEntrance;
  const scrollTrigger = useGSAPScrollTrigger;
  const textAnimation = useGSAPTextAnimation;
  const magnetic = useGSAPMagnetic;
  const morph = useGSAPMorph();
  const batch = useGSAPBatch();

  // Advanced preset animations
  const presets = useMemo(() => ({
    fadeInUp: (target: gsap.TweenTarget, options: GSAPAnimationOptions = {}) => 
      gsapCore.animateFrom(target, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        ...options
      }),

    scaleIn: (target: gsap.TweenTarget, options: GSAPAnimationOptions = {}) =>
      gsapCore.animateFrom(target, {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.7)',
        ...options
      }),

    slideInLeft: (target: gsap.TweenTarget, options: GSAPAnimationOptions = {}) =>
      gsapCore.animateFrom(target, {
        x: -50,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        ...options
      }),

    staggerReveal: (targets: gsap.TweenTarget, options: GSAPAnimationOptions = {}) =>
      gsapCore.animateFrom(targets, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        ...options
      }),

    elasticScale: (target: gsap.TweenTarget, options: GSAPAnimationOptions = {}) =>
      gsapCore.animateTo(target, {
        scale: 1.05,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)',
        yoyo: true,
        repeat: 1,
        ...options
      })
  }), [gsapCore]);

  return {
    ...gsapCore,
    entrance,
    scrollTrigger,
    textAnimation,
    magnetic,
    ...morph,
    ...batch,
    presets
  };
};

export default useGSAPMaster;