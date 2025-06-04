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
import { tryCatch } from "~/lib/try-catch";

const AuthButton = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const {
    data: userInfo,
    isLoading,
    error: userProfileError,
  } = api.user.getCurrentUserProfile.useQuery();

  console.log("Client - isLoading:", isLoading);
  console.log("Client - userInfo:", userInfo);
  console.log("Client - userProfileError:", userProfileError);

  const { isAuthenticated } = useIsAuthenticated();

  const logoutMutation = api.auth.logout.useMutation();

  const handleLogout = async () => {
    const { error } = await tryCatch(logoutMutation.mutateAsync());
    if (error) {
      //TODO: add a toast
      return;
    }

    await utils.auth.check.invalidate();
    router.push("/");
  };

  if (!userInfo) {
    return <div>User info cant be fetched</div>;
  }

  if (isLoading) {
    return (
      <div className="mx-2">
        <Button
          disabled
          className="h-9 w-9 animate-pulse rounded-full bg-gray-100 font-semibold dark:bg-gray-600"
        />
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
