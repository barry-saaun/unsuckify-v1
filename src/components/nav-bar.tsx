"use client";
import Link from "next/link";
import React from "react";

import ThemeToggle from "./theme-toggler";
import AuthButton from "./auth-button";
import StarUs from "./star-us";

const NavBar: React.FC = () => {
  return (
    <div className="z-50 w-full shrink-0 border-b border-black bg-white font-mono dark:border-white dark:bg-black">
      <div className="flex h-12 items-center justify-between px-6">
        <Link
          href="/"
          className="text-sm font-bold tracking-widest text-black uppercase transition-opacity hover:opacity-60 dark:text-white"
        >
          🥟 UNSUCKify
        </Link>
        <div className="flex items-center divide-x divide-black dark:divide-white">
          <StarUs />
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </div>
  );
};

export default NavBar;
