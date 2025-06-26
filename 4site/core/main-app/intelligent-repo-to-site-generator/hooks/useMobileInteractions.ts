import { useRef, useEffect, useCallback, useState } from 'react';
import { useGSAP } from './useGSAP';

interface TouchPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  velocity: number;
  duration: number;
}

interface PinchGesture {
  scale: number;
  center: TouchPosition;
  velocity: number;
}

interface PanGesture {
  deltaX: number;
  deltaY: number;
  velocity: { x: number; y: number };
  isActive: boolean;
}

/**
 * Hook for swipe gesture detection with haptic feedback
 */
export const useSwipeGesture = (
  onSwipe: (gesture: SwipeGesture) => void,
  options: {
    threshold?: number;
    velocityThreshold?: number;
    enableHaptics?: boolean;
    preventDefault?: boolean;
  } = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const startTouch = useRef<TouchPosition | null>(null);
  const { animateTo } = useGSAP();

  const {
    threshold = 50,
    velocityThreshold = 0.3,
    enableHaptics = true,
    preventDefault = true
  } = options;

  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHaptics || !window.navigator.vibrate) return;
    
    const patterns = {
      light: [5],
      medium: [10],
      heavy: [15]
    };
    
    window.navigator.vibrate(patterns[type]);
  }, [enableHaptics]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();
    
    const touch = e.touches[0];
    startTouch.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
  }, [preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!startTouch.current || !elementRef.current) return;
    if (preventDefault) e.preventDefault();

    const endTouch = e.changedTouches[0];
    const deltaX = endTouch.clientX - startTouch.current.x;
    const deltaY = endTouch.clientY - startTouch.current.y;
    const duration = Date.now() - startTouch.current.timestamp;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < threshold) return;

    const velocity = distance / duration;
    if (velocity < velocityThreshold) return;

    // Determine swipe direction
    let direction: SwipeGesture['direction'];
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    // Trigger haptic feedback
    triggerHapticFeedback('light');

    // Visual feedback with GSAP
    animateTo(elementRef.current, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out'
    });

    // Call callback
    onSwipe({ direction, distance, velocity, duration });

    startTouch.current = null;
  }, [threshold, velocityThreshold, onSwipe, triggerHapticFeedback, animateTo, preventDefault]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return { elementRef };
};

/**
 * Hook for pinch-to-zoom gesture detection
 */
export const usePinchGesture = (
  onPinch: (gesture: PinchGesture) => void,
  options: {
    minScale?: number;
    maxScale?: number;
    enableHaptics?: boolean;
  } = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);
  const initialDistance = useRef<number>(0);
  const initialScale = useRef<number>(1);
  
  const {
    minScale = 0.5,
    maxScale = 3,
    enableHaptics = true
  } = options;

  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: Touch, touch2: Touch): TouchPosition => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
    timestamp: Date.now()
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsActive(true);
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      
      if (enableHaptics && window.navigator.vibrate) {
        window.navigator.vibrate([5]);
      }
    }
  }, [enableHaptics]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isActive || e.touches.length !== 2) return;
    e.preventDefault();

    const currentDistance = getDistance(e.touches[0], e.touches[1]);
    const scale = Math.max(minScale, Math.min(maxScale, currentDistance / initialDistance.current));
    const center = getCenter(e.touches[0], e.touches[1]);
    
    onPinch({
      scale,
      center,
      velocity: Math.abs(scale - initialScale.current) / 16 // approximate velocity
    });

    initialScale.current = scale;
  }, [isActive, minScale, maxScale, onPinch]);

  const handleTouchEnd = useCallback(() => {
    setIsActive(false);
    initialDistance.current = 0;
    initialScale.current = 1;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { elementRef, isActive };
};

/**
 * Hook for pan/drag gesture detection
 */
export const usePanGesture = (
  onPan: (gesture: PanGesture) => void,
  options: {
    threshold?: number;
    enableInertia?: boolean;
    bounds?: { x: [number, number]; y: [number, number] };
    enableHaptics?: boolean;
  } = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);
  const startPosition = useRef<TouchPosition | null>(null);
  const lastPosition = useRef<TouchPosition | null>(null);
  const { animateTo } = useGSAP();

  const {
    threshold = 10,
    enableInertia = true,
    bounds,
    enableHaptics = true
  } = options;

  const calculateVelocity = (current: TouchPosition, previous: TouchPosition) => {
    const deltaTime = current.timestamp - previous.timestamp;
    return {
      x: (current.x - previous.x) / deltaTime,
      y: (current.y - previous.y) / deltaTime
    };
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startPosition.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    lastPosition.current = startPosition.current;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!startPosition.current || !lastPosition.current) return;

    const touch = e.touches[0];
    const currentPosition: TouchPosition = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    const deltaX = currentPosition.x - startPosition.current.x;
    const deltaY = currentPosition.y - startPosition.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < threshold && !isActive) return;

    if (!isActive) {
      setIsActive(true);
      if (enableHaptics && window.navigator.vibrate) {
        window.navigator.vibrate([3]);
      }
    }

    e.preventDefault();

    // Apply bounds if specified
    let constrainedDeltaX = deltaX;
    let constrainedDeltaY = deltaY;

    if (bounds) {
      constrainedDeltaX = Math.max(bounds.x[0], Math.min(bounds.x[1], deltaX));
      constrainedDeltaY = Math.max(bounds.y[0], Math.min(bounds.y[1], deltaY));
    }

    const velocity = calculateVelocity(currentPosition, lastPosition.current);

    onPan({
      deltaX: constrainedDeltaX,
      deltaY: constrainedDeltaY,
      velocity,
      isActive: true
    });

    lastPosition.current = currentPosition;
  }, [threshold, isActive, bounds, onPan, enableHaptics]);

  const handleTouchEnd = useCallback(() => {
    if (!isActive || !lastPosition.current || !startPosition.current) return;

    const finalVelocity = calculateVelocity(lastPosition.current, startPosition.current);

    // Apply inertia if enabled
    if (enableInertia && elementRef.current) {
      const inertiaFactor = 0.95;
      const minVelocity = 0.1;

      if (Math.abs(finalVelocity.x) > minVelocity || Math.abs(finalVelocity.y) > minVelocity) {
        animateTo(elementRef.current, {
          x: `+=${finalVelocity.x * 100}`,
          y: `+=${finalVelocity.y * 100}`,
          duration: 1,
          ease: 'power3.out'
        });
      }
    }

    onPan({
      deltaX: 0,
      deltaY: 0,
      velocity: { x: 0, y: 0 },
      isActive: false
    });

    setIsActive(false);
    startPosition.current = null;
    lastPosition.current = null;
  }, [isActive, enableInertia, onPan, animateTo]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { elementRef, isActive };
};

/**
 * Hook for long press gesture detection
 */
export const useLongPress = (
  onLongPress: () => void,
  options: {
    delay?: number;
    enableHaptics?: boolean;
    visualFeedback?: boolean;
  } = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const { animateTo } = useGSAP();

  const {
    delay = 500,
    enableHaptics = true,
    visualFeedback = true
  } = options;

  const startPress = useCallback(() => {
    setIsPressed(true);
    
    if (visualFeedback && elementRef.current) {
      animateTo(elementRef.current, {
        scale: 0.95,
        duration: 0.2,
        ease: 'power2.out'
      });
    }

    timeoutRef.current = setTimeout(() => {
      if (enableHaptics && window.navigator.vibrate) {
        window.navigator.vibrate([10, 50, 10]);
      }
      
      onLongPress();
    }, delay);
  }, [delay, onLongPress, enableHaptics, visualFeedback, animateTo]);

  const endPress = useCallback(() => {
    setIsPressed(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (visualFeedback && elementRef.current) {
      animateTo(elementRef.current, {
        scale: 1,
        duration: 0.2,
        ease: 'elastic.out(1, 0.5)'
      });
    }
  }, [visualFeedback, animateTo]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', startPress, { passive: true });
    element.addEventListener('touchend', endPress, { passive: true });
    element.addEventListener('touchcancel', endPress, { passive: true });
    element.addEventListener('mousedown', startPress);
    element.addEventListener('mouseup', endPress);
    element.addEventListener('mouseleave', endPress);

    return () => {
      element.removeEventListener('touchstart', startPress);
      element.removeEventListener('touchend', endPress);
      element.removeEventListener('touchcancel', endPress);
      element.removeEventListener('mousedown', startPress);
      element.removeEventListener('mouseup', endPress);
      element.removeEventListener('mouseleave', endPress);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [startPress, endPress]);

  return { elementRef, isPressed };
};

/**
 * Hook for pull-to-refresh gesture
 */
export const usePullToRefresh = (
  onRefresh: () => Promise<void>,
  options: {
    threshold?: number;
    maxPull?: number;
    enableHaptics?: boolean;
  } = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number>(0);
  const { animateTo } = useGSAP();

  const {
    threshold = 80,
    maxPull = 120,
    enableHaptics = true
  } = options;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    if (deltaY > 0) {
      e.preventDefault();
      const constrainedPull = Math.min(deltaY * 0.5, maxPull);
      setPullDistance(constrainedPull);
      setIsPulling(true);

      if (constrainedPull >= threshold && enableHaptics && window.navigator.vibrate) {
        window.navigator.vibrate([5]);
      }
    }
  }, [threshold, maxPull, isRefreshing, enableHaptics]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      
      if (enableHaptics && window.navigator.vibrate) {
        window.navigator.vibrate([10]);
      }

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    // Animate back to original position
    if (elementRef.current) {
      animateTo(elementRef.current, {
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, enableHaptics, animateTo]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    isPulling,
    pullDistance,
    isRefreshing,
    progress: Math.min(pullDistance / threshold, 1)
  };
};

/**
 * Master hook combining all mobile interactions
 */
export const useMobileInteractions = () => {
  return {
    useSwipeGesture,
    usePinchGesture,
    usePanGesture,
    useLongPress,
    usePullToRefresh
  };
};

export default useMobileInteractions;