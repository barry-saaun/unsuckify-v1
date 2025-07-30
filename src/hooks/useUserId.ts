import { useEffect, useState } from "react";
import { useAppToast } from "./useAppToast";

export default function useUserId() {
  const [userId, setUserId] = useState<string | null>("");
  const { toastError } = useAppToast();

  useEffect(() => {
    const id = localStorage.getItem("userId");

    if (!id) {
      toastError("Failed to get your Spotify ID.", {
        id: "failed-retrieving-userId",
      });
      setUserId(null);
      return;
    }

    setUserId(id);
  }, [toastError]);
  return userId;
}
