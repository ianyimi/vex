"use client"

import { motion, type Variants } from "motion/react"
import React, { type ComponentPropsWithRef } from "react"

export type PresetType =
  | "blur"
  | "blur-slide"
  | "bounce"
  | "fade"
  | "flip"
  | "rotate"
  | "scale"
  | "slide"
  | "swing"
  | "zoom"

export type AnimatedGroupProps = ComponentPropsWithRef<"div"> & {
  as?: React.ElementType
  asChild?: React.ElementType
  className?: string
  preset?: PresetType
  variants?: {
    container?: Variants
    item?: Variants
  }
}

const defaultContainerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const presetVariants: Record<PresetType, Variants> = {
  "blur-slide": {
    hidden: { filter: "blur(4px)", y: 20 },
    visible: { filter: "blur(0px)", y: 0 },
  },
  slide: {
    hidden: { y: 20 },
    visible: { y: 0 },
  },
  blur: {
    hidden: { filter: "blur(4px)" },
    visible: { filter: "blur(0px)" },
  },
  bounce: {
    hidden: { y: -50 },
    visible: {
      transition: { type: "spring", damping: 10, stiffness: 400 },
      y: 0,
    },
  },
  fade: {},
  flip: {
    hidden: { rotateX: -90 },
    visible: {
      rotateX: 0,
      transition: { type: "spring", damping: 20, stiffness: 300 },
    },
  },
  rotate: {
    hidden: { rotate: -180 },
    visible: {
      rotate: 0,
      transition: { type: "spring", damping: 15, stiffness: 200 },
    },
  },
  scale: {
    hidden: { scale: 0.8 },
    visible: { scale: 1 },
  },
  swing: {
    hidden: { rotate: -10 },
    visible: {
      rotate: 0,
      transition: { type: "spring", damping: 8, stiffness: 300 },
    },
  },
  zoom: {
    hidden: { scale: 0.5 },
    visible: {
      scale: 1,
      transition: { type: "spring", damping: 20, stiffness: 300 },
    },
  },
}

const addDefaultVariants = (variants: Variants) => ({
  hidden: { ...defaultItemVariants.hidden, ...variants.hidden },
  visible: { ...defaultItemVariants.visible, ...variants.visible },
})

function AnimatedGroup({
  as = "div",
  asChild = "div",
  children,
  className,
  preset,
  variants,
  ...divProps
}: AnimatedGroupProps) {
  const selectedVariants = {
    container: addDefaultVariants(defaultContainerVariants),
    item: addDefaultVariants(preset ? presetVariants[preset] : {}),
  }
  const containerVariants = variants?.container ?? selectedVariants.container
  const itemVariants = variants?.item ?? selectedVariants.item

  const MotionComponent = motion.create(as)
  const MotionChild = motion.create(asChild)

  return (
    <MotionComponent
      animate="visible"
      className={className}
      initial="hidden"
      variants={containerVariants}
      {...divProps}
    >
      {React.Children.map(children, (child, index) => (
        <MotionChild key={index} variants={itemVariants}>
          {child}
        </MotionChild>
      ))}
    </MotionComponent>
  )
}

export { AnimatedGroup }
