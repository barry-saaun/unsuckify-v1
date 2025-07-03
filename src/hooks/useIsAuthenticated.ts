"use client";

import { api } from "~/trpc/react";

function useIsAuthenticated() {
  const { data, isLoading, refetch } = api.auth.check.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const authenticateUser = () => refetch();
  const deauthenticateUser = () => refetch();

  return {
    isAuthenticated: data?.isAuthenticated ?? false,
    isLoading,
    authenticateUser,
    deauthenticateUser,
    refetch,
  };
}

export default useIsAuthenticated;
