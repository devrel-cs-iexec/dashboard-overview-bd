"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode, ElementType } from "react";

export function Reveal({
  children,
  delay = 0,
  as = "div",
  className,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const Component = motion[as as keyof typeof motion] as typeof motion.div;
  return (
    <Component
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
}
