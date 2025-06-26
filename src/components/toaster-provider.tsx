"use client";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export default function ToasterProvider() {
  const { resolvedTheme } = useTheme();

  const oppositeTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <SonnerToaster
      theme={oppositeTheme as ToasterProps["theme"]}
      position="bottom-right"
    />
  );
}
