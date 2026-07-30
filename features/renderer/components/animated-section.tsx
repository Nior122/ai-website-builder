'use client';

// =============================================================================
// Animated Section Wrapper
// =============================================================================
// Wraps section content in framer-motion for scroll-triggered animations.
// Maps Animation type strings to framer-motion variant configurations.
// =============================================================================

import { motion, type Variants, type Easing } from 'framer-motion';
import type { ReactNode } from 'react';
import type { Animation } from '@/types';

// ─── Animation Variants ────────────────────────────────────────────────

const animationVariants: Record<string, { hidden: Record<string, unknown>; visible: Record<string, unknown> }> = {
  'fade-in': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  'fade-in-up': {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  'fade-in-down': {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  'fade-in-left': {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  'fade-in-right': {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  'scale-in': {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  'slide-in-up': {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  },
  'slide-in-down': {
    hidden: { opacity: 0, y: -60 },
    visible: { opacity: 1, y: 0 },
  },
  'zoom-in': {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 },
  },
  'blur-in': {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
  },
  'flip-in': {
    hidden: { opacity: 0, rotateX: -90 },
    visible: { opacity: 1, rotateX: 0 },
  },
  'bounce-in': {
    hidden: { opacity: 0, scale: 0.3 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } },
  },
};

// ─── Easing Map ────────────────────────────────────────────────────────

const easingMap: Record<string, number[]> = {
  'ease-out': [0, 0, 0.2, 1],
  'ease-in': [0.4, 0, 1, 1],
  'ease-in-out': [0.4, 0, 0.2, 1],
  'cubic-bezier(0.4, 0, 0.2, 1)': [0.4, 0, 0.2, 1],
};

// ─── Component ─────────────────────────────────────────────────────────

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: Animation | null;
  className?: string;
}

export default function AnimatedSection({
  children,
  animation,
  className,
}: AnimatedSectionProps) {
  if (!animation || animation.type === 'none') {
    return <div className={className}>{children}</div>;
  }

  const variant = animationVariants[animation.type] || animationVariants['fade-in-up'];
  const easing = easingMap[animation.easing] || easingMap['ease-out'];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: animation.once ?? true, margin: '-50px' }}
      variants={{
        hidden: variant.hidden,
        visible: {
          ...variant.visible,
          transition: {
            duration: (animation.duration || 600) / 1000,
            delay: (animation.delay || 0) / 1000,
            ease: easing as unknown as Easing,
          },
        },
      } as Variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
