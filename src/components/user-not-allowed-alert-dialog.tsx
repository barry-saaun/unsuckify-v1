"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useAuth } from "~/hooks/useAuth";

export default function UserNotAllowedAlertDialog() {
  const { logout } = useAuth();

  const handleDialogAction = () => {
    logout();
  };

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>/ Access Denied</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="px-6 py-5 text-sm text-black/60 dark:text-white/60">
          This app is currently awaiting Spotify production approval. Access is
          limited to approved accounts during review.
          <br />
          <br />
          Check the project README for demo.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleDialogAction}>
            Return to Homepage →
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
