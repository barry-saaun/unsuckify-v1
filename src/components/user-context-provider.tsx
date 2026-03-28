"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getCookie, setCookie } from "cookies-next/client";

interface UserContextType {
  userId: string | null;
  setUserId: (id: string) => void;
  isLoading: boolean;
}

const ONE_WEEK = 7 * 24 * 60 * 60;

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const id = getCookie("userId");
      setUserIdState(id ?? null);
    } catch (error) {
      console.error("Failed to get userId from cookie:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUserId = (id: string) => {
    setCookie("userId", id, {
      secure: true,
      path: "/",
      maxAge: ONE_WEEK,
    });
    setUserIdState(id);
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within UserProvider");
  }
  return context;
}
