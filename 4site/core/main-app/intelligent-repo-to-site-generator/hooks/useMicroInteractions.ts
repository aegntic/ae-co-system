import { useRef, useCallback, useEffect, useState } from 'react';
import { useGSAP } from './useGSAP';

interface MicroInteractionConfig {
  type: 'hover' | 'click' | 'focus' | 'success' | 'error' | 'loading' | 'complete';
  intensity?: 'subtle' | 'medium' | 'strong';
  enableHaptics?: boolean;
  enableSound?: boolean;
  customAnimation?: gsap.TweenVars;
}

interface ButtonInteractionConfig extends MicroInteractionConfig {
  pressDepth?: number;
  bounceBack?: boolean;
  rippleEffect?: boolean;
  glowIntensity?: number;
}

interface FormInteractionConfig extends MicroInteractionConfig {
  validationStyle?: 'border' | 'background' | 'icon' | 'shake';
  showValidationIcon?: boolean;
  errorShakeIntensity?: number;
}

/**
 * Core micro-interactions hook for subtle user feedback
 */
export const useMicroInteractions = () => {
  const { animateTo, animateFrom, createTimeline } = useGSAP();

  // Haptic feedback utility
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!window.navigator.vibrate) return;
    
    const patterns = {
      light: [5],
      medium: [10],
      heavy: [15, 5, 10]
    };
    
    window.navigator.vibrate(patterns[type]);
  }, []);

  // Sound feedback utility
  const playSound = useCallback((frequency: number = 800, duration: number = 100) => {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Audio feedback not available:', error);
    }
  }, []);

  // Preset animations
  const presetAnimations = {
    subtle: {
      hover: { scale: 1.02, duration: 0.2, ease: 'power2.out' },
      click: { scale: 0.98, duration: 0.1, yoyo: true, repeat: 1 },
      focus: { boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.3)', duration: 0.2 },
      success: { scale: 1.05, duration: 0.3, ease: 'elastic.out(1, 0.5)' },
      error: { x: -5, duration: 0.1, yoyo: true, repeat: 3, ease: 'power2.inOut' },
      loading: { rotate: 360, duration: 1, repeat: -1, ease: 'none' }
    },
    medium: {
      hover: { scale: 1.05, y: -2, duration: 0.3, ease: 'power2.out' },
      click: { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 },
      focus: { boxShadow: '0 0 0 4px rgba(255, 215, 0, 0.4)', scale: 1.02, duration: 0.2 },
      success: { scale: 1.1, duration: 0.4, ease: 'elastic.out(1, 0.6)' },
      error: { x: -10, duration: 0.15, yoyo: true, repeat: 2, ease: 'power2.inOut' },
      loading: { rotate: 360, scale: 1.1, duration: 0.8, repeat: -1, ease: 'power2.inOut' }
    },
    strong: {
      hover: { scale: 1.08, y: -4, rotateY: 5, duration: 0.3, ease: 'power2.out' },
      click: { scale: 0.9, duration: 0.15, yoyo: true, repeat: 1 },
      focus: { boxShadow: '0 0 0 6px rgba(255, 215, 0, 0.5)', scale: 1.05, duration: 0.3 },
      success: { scale: 1.15, duration: 0.5, ease: 'elastic.out(1, 0.8)' },
      error: { x: -15, duration: 0.2, yoyo: true, repeat: 2, ease: 'power2.inOut' },
      loading: { rotate: 360, scale: 1.2, duration: 0.6, repeat: -1, ease: 'power2.inOut' }
    }
  };

  const executeInteraction = useCallback((
    element: HTMLElement,
    config: MicroInteractionConfig
  ) => {
    const { type, intensity = 'medium', enableHaptics = true, enableSound = false, customAnimation } = config;
    
    // Use custom animation if provided, otherwise use preset
    const animation = customAnimation || presetAnimations[intensity][type];
    
    if (!animation) return;

    // Trigger haptic feedback
    if (enableHaptics) {
      const hapticMap = { subtle: 'light', medium: 'medium', strong: 'heavy' } as const;
      triggerHaptic(hapticMap[intensity]);
    }

    // Trigger sound feedback
    if (enableSound) {
      const soundMap = {
        click: [600, 80],
        hover: [800, 50],
        success: [1000, 150],
        error: [300, 200],
        focus: [700, 100]
      } as const;
      
      if (soundMap[type]) {
        playSound(soundMap[type][0], soundMap[type][1]);
      }
    }

    // Execute animation
    return animateTo(element, animation);
  }, [animateTo, triggerHaptic, playSound]);

  return {
    executeInteraction,
    presetAnimations,
    triggerHaptic,
    playSound
  };
};

/**
 * Hook for enhanced button interactions
 */
export const useButtonInteractions = (config: ButtonInteractionConfig = {}) => {
  const elementRef = useRef<HTMLElement>(null);
  const { executeInteraction } = useMicroInteractions();
  const { animateTo } = useGSAP();
  const [isPressed, setIsPressed] = useState(false);

  const {
    intensity = 'medium',
    enableHaptics = true,
    enableSound = false,
    pressDepth = 0.95,
    bounceBack = true,
    rippleEffect = true,
    glowIntensity = 0.3
  } = config;

  // Ripple effect
  const createRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!rippleEffect || !elementRef.current) return;

    const button = elementRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
    `;

    button.appendChild(ripple);

    animateTo(ripple, {
      scale: 2,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => ripple.remove()
    });
  }, [rippleEffect, animateTo]);

  // Button press animation
  const handlePress = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!elementRef.current) return;

    setIsPressed(true);
    createRipple(e);

    executeInteraction(elementRef.current, {
      type: 'click',
      intensity,
      enableHaptics,
      enableSound,
      customAnimation: {
        scale: pressDepth,
        duration: 0.1,
        ease: 'power2.out'
      }
    });
  }, [executeInteraction, intensity, enableHaptics, enableSound, pressDepth, createRipple]);

  // Button release animation
  const handleRelease = useCallback(() => {
    if (!elementRef.current || !isPressed) return;

    setIsPressed(false);

    if (bounceBack) {
      animateTo(elementRef.current, {
        scale: 1,
        duration: 0.2,
        ease: 'elastic.out(1, 0.5)'
      });
    } else {
      animateTo(elementRef.current, {
        scale: 1,
        duration: 0.15,
        ease: 'power2.out'
      });
    }
  }, [bounceBack, animateTo, isPressed]);

  // Hover effects
  const handleHover = useCallback(() => {
    if (!elementRef.current) return;

    executeInteraction(elementRef.current, {
      type: 'hover',
      intensity,
      enableHaptics: false, // Don't vibrate on hover
      enableSound: false,
      customAnimation: {
        scale: 1.05,
        boxShadow: `0 0 20px rgba(255, 215, 0, ${glowIntensity})`,
        duration: 0.3,
        ease: 'power2.out'
      }
    });
  }, [executeInteraction, intensity, glowIntensity]);

  const handleHoverEnd = useCallback(() => {
    if (!elementRef.current) return;

    animateTo(elementRef.current, {
      scale: 1,
      boxShadow: '0 0 0px rgba(255, 215, 0, 0)',
      duration: 0.2,
      ease: 'power2.out'
    });
  }, [animateTo]);

  return {
    elementRef,
    handlePress,
    handleRelease,
    handleHover,
    handleHoverEnd,
    isPressed
  };
};

/**
 * Hook for form field interactions
 */
export const useFormInteractions = (config: FormInteractionConfig = {}) => {
  const elementRef = useRef<HTMLInputElement>(null);
  const { executeInteraction } = useMicroInteractions();
  const { animateTo } = useGSAP();
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const {
    intensity = 'medium',
    enableHaptics = true,
    enableSound = false,
    validationStyle = 'border',
    showValidationIcon = true,
    errorShakeIntensity = 10
  } = config;

  // Focus animation
  const handleFocus = useCallback(() => {
    if (!elementRef.current) return;

    executeInteraction(elementRef.current, {
      type: 'focus',
      intensity,
      enableHaptics: false,
      enableSound: false
    });
  }, [executeInteraction, intensity]);

  // Validation feedback
  const showValidation = useCallback((isValid: boolean, message?: string) => {
    if (!elementRef.current) return;

    setValidationState(isValid ? 'valid' : 'invalid');

    if (isValid) {
      executeInteraction(elementRef.current, {
        type: 'success',
        intensity,
        enableHaptics,
        enableSound
      });

      // Green border for valid input
      if (validationStyle === 'border') {
        animateTo(elementRef.current, {
          borderColor: '#22c55e',
          duration: 0.3
        });
      }
    } else {
      // Error shake animation
      executeInteraction(elementRef.current, {
        type: 'error',
        intensity,
        enableHaptics,
        enableSound,
        customAnimation: {
          x: [-errorShakeIntensity, errorShakeIntensity, -errorShakeIntensity/2, errorShakeIntensity/2, 0],
          duration: 0.5,
          ease: 'power2.inOut'
        }
      });

      // Red border for invalid input
      if (validationStyle === 'border') {
        animateTo(elementRef.current, {
          borderColor: '#ef4444',
          duration: 0.3
        });
      }
    }

    // Show validation icon
    if (showValidationIcon) {
      const icon = elementRef.current.nextElementSibling as HTMLElement;
      if (icon && icon.classList.contains('validation-icon')) {
        icon.textContent = isValid ? '✓' : '✗';
        icon.style.color = isValid ? '#22c55e' : '#ef4444';
        
        animateTo(icon, {
          scale: [0, 1.2, 1],
          duration: 0.4,
          ease: 'elastic.out(1, 0.5)'
        });
      }
    }
  }, [executeInteraction, intensity, enableHaptics, enableSound, validationStyle, showValidationIcon, errorShakeIntensity, animateTo]);

  // Clear validation state
  const clearValidation = useCallback(() => {
    if (!elementRef.current) return;

    setValidationState('idle');
    
    animateTo(elementRef.current, {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      duration: 0.3
    });

    // Hide validation icon
    if (showValidationIcon) {
      const icon = elementRef.current.nextElementSibling as HTMLElement;
      if (icon && icon.classList.contains('validation-icon')) {
        animateTo(icon, {
          scale: 0,
          duration: 0.2
        });
      }
    }
  }, [animateTo, showValidationIcon]);

  return {
    elementRef,
    handleFocus,
    showValidation,
    clearValidation,
    validationState
  };
};

/**
 * Hook for loading state micro-interactions
 */
export const useLoadingInteractions = () => {
  const elementRef = useRef<HTMLElement>(null);
  const { executeInteraction } = useMicroInteractions();
  const { animateTo, createTimeline } = useGSAP();
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    if (!elementRef.current) return;

    setIsLoading(true);
    
    executeInteraction(elementRef.current, {
      type: 'loading',
      intensity: 'medium',
      enableHaptics: false,
      enableSound: false
    });
  }, [executeInteraction]);

  const stopLoading = useCallback((success: boolean = true) => {
    if (!elementRef.current || !isLoading) return;

    setIsLoading(false);

    // Stop rotation
    animateTo(elementRef.current, {
      rotate: 0,
      duration: 0.3,
      ease: 'power2.out'
    });

    // Success or error feedback
    setTimeout(() => {
      if (elementRef.current) {
        executeInteraction(elementRef.current, {
          type: success ? 'success' : 'error',
          intensity: 'medium',
          enableHaptics: true,
          enableSound: true
        });
      }
    }, 100);
  }, [executeInteraction, animateTo, isLoading]);

  const pulseLoader = useCallback(() => {
    if (!elementRef.current) return;

    const timeline = createTimeline({ repeat: -1 });
    
    timeline
      .to(elementRef.current, {
        scale: 1.1,
        opacity: 0.8,
        duration: 0.5,
        ease: 'power2.inOut'
      })
      .to(elementRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.inOut'
      });

    return timeline;
  }, [createTimeline]);

  return {
    elementRef,
    startLoading,
    stopLoading,
    pulseLoader,
    isLoading
  };
};

/**
 * Hook for notification micro-interactions
 */
export const useNotificationInteractions = () => {
  const { animateFrom, animateTo } = useGSAP();
  const { triggerHaptic, playSound } = useMicroInteractions();

  const showNotification = useCallback((
    element: HTMLElement,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    // Entrance animation
    animateFrom(element, {
      y: -50,
      opacity: 0,
      scale: 0.9,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)'
    });

    // Haptic and sound feedback
    const feedbackMap = {
      success: { haptic: 'light' as const, sound: [1000, 150] as const },
      error: { haptic: 'heavy' as const, sound: [300, 200] as const },
      warning: { haptic: 'medium' as const, sound: [600, 120] as const },
      info: { haptic: 'light' as const, sound: [800, 100] as const }
    };

    const feedback = feedbackMap[type];
    triggerHaptic(feedback.haptic);
    playSound(feedback.sound[0], feedback.sound[1]);
  }, [animateFrom, triggerHaptic, playSound]);

  const hideNotification = useCallback((element: HTMLElement) => {
    return animateTo(element, {
      y: -30,
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: 'power2.in'
    });
  }, [animateTo]);

  return {
    showNotification,
    hideNotification
  };
};

/**
 * Master hook combining all micro-interactions
 */
export const useMicroInteractionsMaster = () => {
  const core = useMicroInteractions();
  const button = useButtonInteractions;
  const form = useFormInteractions;
  const loading = useLoadingInteractions;
  const notification = useNotificationInteractions();

  return {
    ...core,
    button,
    form,
    loading,
    notification
  };
};

export default useMicroInteractionsMaster;