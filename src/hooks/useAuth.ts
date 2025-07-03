"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthError } from "~/components/auth-error-provider";
import { api } from "~/trpc/react";

export const useAuth = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const { setSessionExpired, isHandled, setIsHandled } = useAuthError();

  const logout = api.auth.logout.useMutation({
    onSuccess: async () => {
      await fetch("/api/logout", { method: "POST" });

      await utils.invalidate();

      localStorage.removeItem("userId");

      router.push("/");
    },
    onError: (error) => {
      console.error("Logged out failed: ", error);
      toast.error("Failed to log out. Please try again.");
    },
  });

  const handleSessionExpired = async () => {
    if (isHandled) return;

    await utils.invalidate();

    localStorage.removeItem("userId");
    setSessionExpired(true);
    setIsHandled(true);
  };

  return {
    logout: logout.mutate,
    handleSessionExpired,
    isLoggingOut: logout.isPending,
  };
};
