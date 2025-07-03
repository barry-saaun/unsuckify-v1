"use client";
import { useRouter } from "next/navigation";
import { useAuthError } from "./auth-error-provider";
import { useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export default function SessionExpiredAlertDialog() {
  const { sessionExpired, setSessionExpired, isHandlingSessionExpiryRef } =
    useAuthError();
  const router = useRouter();

  const handleConfirm = useCallback(async () => {
    try {
      isHandlingSessionExpiryRef.current = true;

      localStorage.setItem("manualLogout", "true");

      // Clear session state
      setSessionExpired(false);

      // Clear localStorage
      localStorage.clear();

      // Navigate
      router.push("/");
    } catch (error) {
      console.error("Error during session cleanup:", error);
      router.push("/");
    } finally {
      setTimeout(() => {
        isHandlingSessionExpiryRef.current = false;
      }, 1000);
    }
  }, [setSessionExpired, isHandlingSessionExpiryRef, router]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setSessionExpired(false);
      }
    },
    [setSessionExpired],
  );

  if (!sessionExpired) return null;

  return (
    <AlertDialog open={sessionExpired} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expired</AlertDialogTitle>
          <AlertDialogDescription>
            Your session has expired. Please log in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
