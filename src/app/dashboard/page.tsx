"use client";
import { skipToken } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import MyPlaylistsTabContent from "~/components/my-playlists-tab-content";
import PublicPlaylistTabContent from "~/components/public-playlist-tab-content";
import Spinner from "~/components/spinner";
import { useUserContext } from "~/components/user-context-provider";
import UserNotAllowedAlertDialog from "~/components/user-not-allowed-alert-dialog";
import { api } from "~/trpc/react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { Sparkles, Music, Link2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAppToast } from "~/hooks/useAppToast";

type TabStates = "my-playlists" | "public-playlist";

function Dashboard() {
  const [tabValue, setTabValue] = useState<TabStates>("my-playlists");

  const { userId, isLoading: isUserIdLoading } = useUserContext();
  const { data: isUserAllowed, isLoading: isUserAllowedLoading } =
    api.auth.isUserAllowed.useQuery(userId ? { userId } : skipToken, {
      staleTime: 360 * 100 * 100,
      enabled: !!userId,
    });

  console.log("userId:", userId);
  console.log("isUserAllowed: ", isUserAllowed);

  // Unified loading state
  if (isUserIdLoading || !userId || isUserAllowedLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="space-y-4 text-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 top-0 left-0 animate-pulse rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-20 blur-xl"></div>

            <Spinner extraCN="h-12 w-12 top-0 left-0 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              Loading your music library
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isUserIdLoading
                ? "Connecting to Spotify..."
                : "Preparing your playlists..."}
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (isUserAllowed === false) {
    return <UserNotAllowedAlertDialog />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="mx-6 space-y-8 py-12 sm:mx-8 md:mx-12">
        <div className="mb-8 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <h1 className="bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:to-zinc-300">
              {tabValue === "my-playlists" ? "Your Library" : "Discover"}
            </h1>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </motion.div>
          </motion.div>

          {/* Modern segmented control - positioned to the right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
          >
            {/* Sliding indicator */}
            <motion.div
              className={cn(
                "absolute inset-y-1 left-1 w-[120px] rounded-full bg-white transition-all duration-300 ease-in-out dark:bg-zinc-700",
                tabValue === "public-playlist" &&
                  "w-[95px] translate-x-[130px]",
              )}
              layoutId="tab-indicator"
            />

            <button
              onClick={() => setTabValue("my-playlists")}
              className={cn(
                "relative z-10 flex items-center space-x-2 rounded-full px-6 py-2 transition-colors duration-300",
                tabValue === "my-playlists"
                  ? "font-semibold text-zinc-900 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              <Music className="h-4 w-4" />
              <span>Library</span>
            </button>

            <button
              onClick={() => setTabValue("public-playlist")}
              className={cn(
                "relative z-10 flex items-center space-x-2 rounded-full px-6 py-2 transition-colors duration-300",
                tabValue === "public-playlist"
                  ? "font-semibold text-zinc-900 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              <Link2 className="h-4 w-4" />
              <span>URL</span>
            </button>
          </motion.div>
        </div>

        {/* Animated content transition */}
        <motion.div
          key={tabValue}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {tabValue === "my-playlists" ? (
            <MyPlaylistsTabContent />
          ) : (
            <PublicPlaylistTabContent />
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
