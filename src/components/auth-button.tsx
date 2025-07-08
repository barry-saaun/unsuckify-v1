import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LogOutIcon, UserRound } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { cn, getInitials } from "~/lib/utils";
import useIsAuthenticated from "~/hooks/useIsAuthenticated";
import { api } from "~/trpc/react";
import Spinner from "./spinner";
import { useEffect } from "react";
import { useAuth } from "~/hooks/useAuth";
import { useAppToast } from "~/hooks/useAppToast";

const AuthButton = () => {
  const router = useRouter();

  const { isAuthenticated } = useIsAuthenticated();

  const {
    data: userInfo,
    isLoading,
    error: userProfileError,
  } = api.user.getCurrentUserProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { logout, isLoggingOut } = useAuth();
  const { toastError } = useAppToast();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId && userInfo) {
      localStorage.setItem("userId", userInfo?.id);
    }
  }, [userInfo]);

  const handleLogout = () => {
    logout();
  };

  if (
    userProfileError &&
    userProfileError.shape?.data.code === "UNAUTHORIZED"
  ) {
    toastError("Please log in to continue", { id: "auth-error" });

    router.push("/login");
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading || isLoggingOut) {
    return (
      <div className="bg-muted mx-2 flex h-10 w-10 items-center justify-center rounded-full">
        <Spinner />
      </div>
    );
  }

  if (userProfileError) {
    console.error("Profile Error:", userProfileError);
    return null;
  }

  if (!userInfo) {
    console.warn("No user profile data received.");
    return null;
  }

  return (
    <div className={cn(isAuthenticated && userInfo ? "mx-2" : "")}>
      {isAuthenticated && userInfo ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="h-9 w-9"
            disabled={isLoggingOut}
          >
            <Button
              variant="outline"
              className="rounded-full ring-2 ring-purple-100 dark:ring-purple-700"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={userInfo?.images?.[0]?.url} />
                <AvatarFallback>
                  {getInitials(userInfo?.display_name ?? "")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="px-2">
              <div
                className="flex cursor-pointer items-center justify-between gap-10"
                onClick={() =>
                  window.open(`https://open.spotify.com/user/${userInfo?.id}`)
                }
              >
                <div className="flex flex-col space-y-[2px]">
                  <h1 className="text-base font-bold tracking-tight">
                    {userInfo?.display_name}
                  </h1>
                  <span className="text-gray-500 dark:text-gray-400">
                    {userInfo?.email}
                  </span>
                </div>
                <UserRound className="h-4 w-4 opacity-50" />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-600"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
};

export default AuthButton;
