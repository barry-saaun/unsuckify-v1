"use client";
import type React from "react";

type InfoBannerProp = {
  isOwned: boolean;
};

const InfoBanner: React.FC<InfoBannerProp> = ({ isOwned }) => {
  return (
    <div className="border border-black px-4 py-3 font-mono dark:border-white">
      <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
        / Note
      </span>
      <p className="mt-1 text-xs font-bold tracking-wide text-black uppercase dark:text-white">
        {isOwned
          ? "Click the save button on any track to add it to this playlist."
          : "Click on any track to select it for your new playlist."}
      </p>
    </div>
  );
};

export default InfoBanner;
