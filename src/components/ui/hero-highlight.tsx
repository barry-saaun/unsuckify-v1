"use client";
import { cn } from "~/lib/utils";
import { useMotionValue, motion, useMotionTemplate } from "framer-motion";
import React from "react";

export const HeroHighlight = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget) return;
    const { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  return (
    <div
      className={cn(
        "group relative flex w-full items-center justify-center",
        containerClassName,
      )}
      onMouseMove={handleMouseMove}
    >
      {/* <div className="bg-dot-thick-neutral-300 dark:bg-dot-thick-neutral-800 pointer-events-none absolute inset-0" /> */}
      <div className="pointer-events-none absolute inset-0" />
      <motion.div
        className="bg-dot-thick-indigo-500 dark:bg-dot-thick-indigo-500 pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />

      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
};

export const Highlight = ({
  children,
  isBlock = false,
  className,
}: {
  children: React.ReactNode;
  isBlock?: boolean;
  className?: string;
}) => {
  return (
    <motion.span
      initial={{
        backgroundSize: "0% 100%",
      }}
      animate={{
        backgroundSize: "100% 100%",
      }}
      transition={{
        duration: 2,
        ease: "linear",
        delay: 0.5,
      }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: isBlock ? "inline-block" : "inline",
      }}
      className={cn(
        `relative inline-block rounded-lg bg-gradient-to-r from-green-400 to-indigo-400 px-1 pb-1 dark:from-green-500 dark:to-indigo-600`,
        className,
      )}
    >
      {children}
    </motion.span>
  );
};
