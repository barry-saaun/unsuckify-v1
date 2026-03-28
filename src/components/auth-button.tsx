import { useRouter } from "next/navigation";
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
import { getCookie } from "cookies-next/client";
import { useUserContext } from "./user-context-provider";

const AuthButton = () => {
  const router = useRouter();

  const { isAuthenticated } = useIsAuthenticated();
  const { setUserId } = useUserContext();

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
    // const userId = localStorage.getItem("userId");
    const userId = getCookie("userId");

    if (!userId && userInfo) {
      setUserId(userInfo.id);
    }
  }, [userInfo, setUserId]);

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
      <div className="flex h-12 w-12 items-center justify-center">
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
    <div className={cn(isAuthenticated && userInfo ? "pl-0" : "")}>
      {isAuthenticated && userInfo ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoggingOut}>
            <button className="flex h-12 w-12 items-center justify-center transition-opacity hover:opacity-60 focus:outline-none">
              <Avatar className="h-7 w-7 rounded-none">
                <AvatarImage
                  src={userInfo?.images?.[0]?.url}
                  className="rounded-none"
                />
                <AvatarFallback className="rounded-none bg-black font-mono text-xs font-bold text-white dark:bg-white dark:text-black">
                  {getInitials(userInfo?.display_name ?? "")}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-48 rounded-none border-black font-mono dark:border-white"
          >
            <DropdownMenuItem className="rounded-none px-3 py-2 focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black">
              <div
                className="flex w-full cursor-pointer items-center justify-between gap-10"
                onClick={() =>
                  window.open(`https://open.spotify.com/user/${userInfo?.id}`)
                }
              >
                <div className="flex flex-col space-y-[2px]">
                  <span className="text-sm font-bold tracking-wide uppercase">
                    {userInfo?.display_name}
                  </span>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {userInfo?.email}
                  </span>
                </div>
                <UserRound className="h-3 w-3 opacity-40" />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-black/20 dark:bg-white/20" />
            <DropdownMenuItem
              className="rounded-none px-3 py-2 text-xs tracking-widest uppercase focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOutIcon className="mr-2 h-3 w-3" />
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
};

export default AuthButton;
