"use client";
import Link from "next/link";
import React from "react";

import ThemeToggle from "./theme-toggler";
// import AuthButton from "./AuthButton";
import StarUs from "./star-us";

const NavBar: React.FC = () => {
  return (
    <div className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex flex-row items-center justify-center gap-2"
          >
            <span className="text-2xl">{String.fromCodePoint(0x1f95f)}</span>
            <span className="text-primary text-xl font-bold">UNSUCKify</span>
          </Link>
          <div className="flex flex-row items-center justify-center gap-1">
            <StarUs />
            <ThemeToggle />
            {/* <AuthButton /> */}
            <span>auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
