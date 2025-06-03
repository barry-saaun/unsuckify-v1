"use client";
import { motion } from "framer-motion";
import { HeroHighlight, Highlight } from "~/components/ui/hero-highlight";
import Link from "next/link";
import { HoverBorderGradient } from "~/components/ui/hover-border-gradient";
import { useState } from "react";

const HeroSection = () => {
  // const { isAuthenticated } = useIsAuthenticated();
  const [isAuthenticated, useIsAuthenticated] = useState(false);
  return (
    <HeroHighlight>
      <motion.h1
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: [20, -5, 0],
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        className="mx-auto max-w-4xl px-4 text-center text-2xl leading-relaxed font-bold text-neutral-700 md:text-4xl lg:text-5xl lg:leading-snug dark:text-white"
      >
        <div className="flex flex-col space-y-2 md:space-y-6">
          <h1 className="text-4xl leading-relaxed font-bold tracking-tighter sm:text-6xl lg:text-7xl">
            Your{" "}
            <span className="text-green-500 dark:text-green-400">Spotify</span>{" "}
            Playlist Sucks?
            <Highlight isBlock>Let&apos;s unsuck it.</Highlight>
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 sm:text-lg md:text-xl dark:text-gray-400">
            Transform your <span className="font-bold">mid</span> spotify
            playlist to JSON format and received songs recommendation from AI.
          </p>
          <div className="flex items-center justify-center py-8 md:py-12">
            <HoverBorderGradient as="button">
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="text-sm font-light md:text-xl"
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </Link>
            </HoverBorderGradient>
          </div>
        </div>
      </motion.h1>
    </HeroHighlight>
  );
};
export default HeroSection;
