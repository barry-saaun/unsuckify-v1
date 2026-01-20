"use client";
import { BadgeInfo, PlusCircle } from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";
import { cn } from "~/lib/utils";

type InfoBannerProp = {
  isOwned: boolean;
};

const InfoBanner: React.FC<InfoBannerProp> = ({ isOwned }) => {
  const { theme } = useTheme();

  const bannerContent = isOwned
    ? {
        icon: <PlusCircle className="h-5 w-5" />,
        message: "Add tracks to your playlist",
        gradient: "from-blue-500/10 to-cyan-500/10",
      }
    : {
        icon: <BadgeInfo className="h-5 w-5" />,
        message: "Select tracks to create your perfect playlist",
        gradient: "from-purple-500/10 to-pink-500/10",
      };

  return (
    <div
      className={cn(
        "w-full rounded-xl p-4",
        "bg-gradient-to-r",
        bannerContent.gradient,
        "border border-white/20 dark:border-gray-800/50",
        "backdrop-blur-sm",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            "bg-white/50 dark:bg-gray-800/50",
            "text-purple-600 dark:text-purple-400",
          )}
        >
          {bannerContent.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {bannerContent.message}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isOwned
              ? "Click the save button on any track to add it to this playlist"
              : "Click on any track card to select it for your new playlist"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoBanner;
