import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = "", hover = false, onClick }: CardProps) {
  const Component = hover ? motion.div : "div";
  const hoverProps = hover
    ? { whileHover: { y: -2, scale: 1.01 }, transition: { type: "spring", stiffness: 400, damping: 25 } }
    : {};

  return (
    <Component
      className={`bg-surface rounded-2xl shadow-lg shadow-black/20 border border-border p-4 ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      {...hoverProps}
    >
      {children}
    </Component>
  );
}
