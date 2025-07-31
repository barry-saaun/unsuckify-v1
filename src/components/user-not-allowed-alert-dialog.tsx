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
          <AlertDialogTitle>Access Denied</AlertDialogTitle>
          <AlertDialogDescription>
            We&apos;re sorry, but you are not authorized to access this page.
            Please contact support if you believe this is an error.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleDialogAction}>
            Return to Homepage
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
