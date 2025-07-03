"use client";
import { useContext, createContext, useState, useRef } from "react";
import React from "react";

type AuthErrorContextType = {
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
  isHandlingSessionExpiryRef: React.MutableRefObject<boolean>;
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
  const isHandlingSessionExpiryRef = useRef(false);
  return (
    <AuthErrorContext.Provider
      value={{
        sessionExpired,
        setSessionExpired,
        isHandlingSessionExpiryRef,
      }}
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
