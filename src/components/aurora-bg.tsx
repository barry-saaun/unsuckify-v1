"use client";
import { cn } from "~/lib/utils";
import React, { type ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "transition-bg relative flex h-[100vh] flex-col items-center justify-center bg-zinc-50 text-slate-950 dark:bg-zinc-900",
          className,
        )}
        {...props}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={
            {
              "--aurora":
                "repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)",
              "--dark-gradient":
                "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",
              "--light-gradient":
                "repeating-linear-gradient(100deg,#f1f5f9_0%,#f1f5f9_7%,transparent_10%,transparent_12%,#f1f5f9_16%)",

              "--blue-300": "#93c5fd",
              "--blue-400": "#60a5fa",
              "--blue-500": "#3b82f6",
              "--blue-600": "#2563eb",
              "--indigo-300": "#a5b4fc",
              "--indigo-400": "#818cf8",
              "--violet-200": "#ddd6fe",
              "--violet-300": "#c4b5fd",
              "--purple-300": "#d8b4fe",
              "--black": "#000",
              "--light-bg": "#f1f5f9",
              "--transparent": "transparent",
            } as React.CSSProperties
          }
        >
          <div
            //   I'm sorry but this is what peak developer performance looks like // trigger warning
            className={cn(
              `after:animate-aurora pointer-events-none absolute -inset-[10px] opacity-60 blur-[8px] will-change-transform`,
              // Light mode styles
              `[background-image:var(--light-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] [--aurora:repeating-linear-gradient(100deg,var(--blue-600)_10%,var(--indigo-400)_15%,var(--blue-500)_20%,var(--violet-300)_25%,var(--purple-300)_30%)] [--light-gradient:repeating-linear-gradient(100deg,var(--light-bg)_0%,var(--light-bg)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--light-bg)_16%)]`,
              // After pseudo-element for light mode
              `after:absolute after:inset-0 after:[background-image:var(--light-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:fixed] after:opacity-70 after:mix-blend-multiply after:content-[""]`,
              // Dark mode styles
              `dark:[background-image:var(--dark-gradient),var(--aurora)] dark:opacity-50 dark:blur-[10px] dark:invert dark:[--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)] dark:[--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]`,
              // After pseudo-element for dark mode
              `after:dark:[background-image:var(--dark-gradient),var(--aurora)] after:dark:opacity-100 after:dark:mix-blend-difference`,

              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
            )}
          ></div>
        </div>
        {children}
      </div>
    </main>
  );
};
