"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useAuth } from "~/hooks/useAuth";

const ACCESS_DENIED_MESSAGE = {
  title: "/ Access Denied",
  description:
    "Thanks for visiting! We're currently limited by Spotify's API policies, which require 250k users for full access. Head over to the README to see a demo instead.",
  docsUrl:
    "https://developer.spotify.com/documentation/web-api/concepts/quota-modes",
  docsLabel: "Read more",
  action: "Return to Homepage →",
};

function AccessDeniedDescription() {
  return (
    <p className="px-6 py-5 text-sm text-black/60 dark:text-white/60">
      {ACCESS_DENIED_MESSAGE.description}
      <br />
      <a
        href={ACCESS_DENIED_MESSAGE.docsUrl}
        className="font-bold italic underline underline-offset-1"
        target="_blank"
      >
        {ACCESS_DENIED_MESSAGE.docsLabel}
      </a>
      <br />
      <br />
    </p>
  );
}

export default function UserNotAllowedAlertDialog() {
  const { logout } = useAuth();

  const handleDialogAction = () => {
    logout();
  };

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{ACCESS_DENIED_MESSAGE.title}</AlertDialogTitle>
        </AlertDialogHeader>
        <AccessDeniedDescription />
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleDialogAction}>
            {ACCESS_DENIED_MESSAGE.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
