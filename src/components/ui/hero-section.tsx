"use client";
import { motion } from "framer-motion";
import { HeroHighlight, Highlight } from "~/components/ui/hero-highlight";
import useIsAuthenticated from "~/hooks/useIsAuthenticated";
import Link from "next/link";
import { HoverBorderGradient } from "./hover-border-gradient";
import { AuroraBackground } from "../aurora-bg";

const HeroSection = () => {
  const { isAuthenticated } = useIsAuthenticated();
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col items-center justify-center gap-4 px-4"
      >
        <HeroHighlight
          className="flex h-full items-center justify-center"
          containerClassName="min-h-[calc(100vh-56px)] flex items-center justify-center"
        >
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
              duration: 0.25,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="mx-auto max-w-4xl px-4 text-center text-2xl leading-relaxed font-bold text-neutral-700 md:text-4xl lg:text-5xl lg:leading-snug dark:text-white"
          >
            <div className="flex flex-col space-y-2 md:space-y-6">
              <h1 className="text-4xl leading-relaxed font-bold tracking-tighter sm:text-6xl lg:text-7xl">
                Your{" "}
                <span className="text-green-500 dark:text-green-400">
                  Spotify
                </span>{" "}
                Playlist Sucks?
                <Highlight isBlock>Let&apos;s unsuck it.</Highlight>
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 sm:text-lg md:text-xl dark:text-gray-300">
                Transform your <span className="font-bold">mid</span> spotify
                playlist to JSON format and received songs recommendation from
                AI.
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
      </motion.div>
    </AuroraBackground>
  );
};
export default HeroSection;
