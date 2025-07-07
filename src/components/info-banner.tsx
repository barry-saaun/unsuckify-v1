"use client";
import { Info } from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";

type InfoBannerProp = {
  isOwned: boolean;
};

const InfoBanner: React.FC<InfoBannerProp> = ({ isOwned }) => {
  const { theme } = useTheme();
  return (
    <div className="my-5 flex h-12 w-3/4 items-center justify-start gap-4 rounded-md bg-[#EEF2FD] px-3 dark:bg-[#19244B]">
      {theme === "dark" ? (
        <Info stroke="#9CABF8" size={14} />
      ) : (
        <Info stroke="#556BC8" size={14} />
      )}

      <h1 className="text-sm font-[500] text-[#556BC8] dark:text-[#9CABF8]">
        {isOwned
          ? "Add track to your playlist"
          : "Click on a card to select or deselect track for your new playlist."}
      </h1>
    </div>
  );
};

export default InfoBanner;
