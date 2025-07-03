"use client";
import { useContext, createContext, useState } from "react";
import React from "react";

type AuthErrorContextType = {
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
  isHandled: boolean;
  setIsHandled: (handled: boolean) => void;
};

const AuthErrorContext = createContext<AuthErrorContextType | undefined>(
  undefined,
);

export const AuthErrorProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isHandled, setIsHandled] = useState(false);

  return (
    <AuthErrorContext.Provider
      value={{ sessionExpired, setSessionExpired, isHandled, setIsHandled }}
    >
      {children}
    </AuthErrorContext.Provider>
  );
};

export const useAuthError = () => {
  const ctx = useContext(AuthErrorContext);
  if (!ctx)
    throw new Error("useAuthError must be used within AuthErrorProvider");
  return ctx;
};
