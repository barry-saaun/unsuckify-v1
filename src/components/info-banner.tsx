"use client";
import type React from "react";

type InfoBannerProp = {
  isOwned: boolean;
  ownedMode?: "add" | "new";
};

const InfoBanner: React.FC<InfoBannerProp> = ({
  isOwned,
  ownedMode = "new",
}) => {
  let message: string;
  if (!isOwned) {
    message = "Click on any track to select it for your new playlist.";
  } else if (ownedMode === "add") {
    message = "Click any track to add it directly to this playlist.";
  } else {
    message = "Select tracks, then create a new playlist from them below.";
  }

  return (
    <div className="border border-black px-4 py-3 font-mono dark:border-white">
      <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
        / Note
      </span>
      <p className="mt-1 text-xs font-bold tracking-wide text-black uppercase dark:text-white">
        {message}
      </p>
    </div>
  );
};

export default InfoBanner;
