"use client";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { useAppToast } from "./useAppToast";

export default function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toastError } = useAppToast();

  useEffect(() => {
    try {
      const id = getCookie("userId") as string;
      if (!id) {
        setUserId(null);
      } else {
        setUserId(id);
      }
    } catch (error) {
      console.error("Error reading cookie:", error);
      toastError("Failed to get your Spotify ID.", {
        id: "failed-retrieving-userId",
      });
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  return { userId, isLoading };
}
