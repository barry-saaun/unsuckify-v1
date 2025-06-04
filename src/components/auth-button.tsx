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
// import { CurrentUsersProfileResponse } from "spotify-api"
import { cn, getInitials } from "~/lib/utils";
import useIsAuthenticated from "~/hooks/useIsAuthenticated";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";

const AuthButton = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const {
    data: userInfo,
    isLoading,
    error: userProfileError,
  } = api.user.getCurrentUserProfile.useQuery();

  const { isAuthenticated } = useIsAuthenticated();

  const handleLogout = async () => {
    const res = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      await utils.auth.check.invalidate();
      router.push("/");
    }
  };

  if (!userInfo || userProfileError) {
    //TODO: add a toast
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-muted mx-2 flex h-10 w-10 items-center justify-center rounded-full">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn(isAuthenticated && userInfo ? "mx-2" : "")}>
      {isAuthenticated && userInfo ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="h-9 w-9">
            <Button variant="ghost" className="rounded-full">
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
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
};

export default AuthButton;
