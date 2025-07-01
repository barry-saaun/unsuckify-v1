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

export default function SessionExpiredAlertDialog() {
  const { sessionExpired, setSessionExpired } = useAuthError();

  const router = useRouter();

  if (!sessionExpired) return null;

  const handleDialogAction = () => {
    setSessionExpired(false);
    router.push("/");
  };

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
          <AlertDialogAction onClick={handleDialogAction}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
