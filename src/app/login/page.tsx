"use client";
import { Icons, Spinner } from "~/components/Icons";
import { Button } from "~/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/login";
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex min-h-[100vh] w-full flex-col items-center justify-center">
      <Button onClick={handleGoBack} className="absolute top-20 left-10 flex">
        <ChevronLeft />
        <span className="font-medium">Back</span>
      </Button>
      <div className="mx-auto flex w-3/4 flex-col justify-center space-y-6 sm:w-[350px] md:w-1/2">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to UNSUCKify
          </h1>
          <p className="text-muted-foreground text-sm">
            Log in with your Spotify acccount to get started
          </p>
        </div>
        <Button
          className="flex flex-row gap-2 rounded-md bg-[#1DB954] px-4 py-2 font-semibold text-white shadow-md hover:bg-[#1aa34a] dark:bg-[#1DB954] dark:shadow-none"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner />
          ) : (
            <>
              <Icons.spotify />
              <p>Log in with Spotify</p>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
