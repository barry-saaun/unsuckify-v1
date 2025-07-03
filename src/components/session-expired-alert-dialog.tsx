"use client";
import { useRouter } from "next/navigation";
import { useAuthError } from "./auth-error-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { api } from "~/trpc/react";

export default function SessionExpiredAlertDialog() {
  const { sessionExpired, setSessionExpired, setIsHandled } = useAuthError();

  const router = useRouter();
  const utils = api.useUtils();

  const handleConfirm = async () => {
    await utils.invalidate();
    localStorage.clear();

    setSessionExpired(false);
    setIsHandled(false);
    router.push("/");
  };

  if (!sessionExpired) return null;

  return (
    <AlertDialog open={sessionExpired}>
      {/* <AlertDialogTrigger asChild> */}
      {/*   <Button variant="outline">Show Dialog</Button> */}
      {/* </AlertDialogTrigger> */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expired</AlertDialogTitle>
          <AlertDialogDescription>
            Your session has expired. Please log in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* <AlertDialogCancel>Cancel</AlertDialogCancel> */}
          <AlertDialogAction onClick={handleConfirm}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
