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
  // This is the mocked boolean variable to simulate checking the user's ID.
  // In a real application, this would be based on a proper check.
  const isUserAllowed = false;
  const { logout } = useAuth();

  const handleDialogAction = () => {
    logout();
  };

  return (
    <AlertDialog open={!isUserAllowed}>
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
