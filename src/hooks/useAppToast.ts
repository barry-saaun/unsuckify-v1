import { useTheme } from "next-themes";
import { toast, type ExternalToast } from "sonner";

export function useAppToast() {
  const { resolvedTheme } = useTheme();

  const oppositeTheme = resolvedTheme === "dark" ? "light" : "dark";

  const errorStyle = {
    dark: {
      backgroundColor: "#fef2f2",
      borderColor: "#fecaca",
      color: "#991b1b",
    } as const,
    light: {
      backgroundColor: "#450a0a",
      borderColor: "#7f1d1d",
      color: "#fca5a5",
    } as const,
  };

  function toastError(message: string, options: ExternalToast = {}) {
    toast.error(message, {
      style: {
        backgroundColor:
          oppositeTheme === "dark"
            ? errorStyle.dark.backgroundColor
            : errorStyle.light.backgroundColor,
        borderColor:
          oppositeTheme === "dark"
            ? errorStyle.dark.borderColor
            : errorStyle.light.borderColor,
        color:
          oppositeTheme === "dark"
            ? errorStyle.dark.color
            : errorStyle.light.color,
      },
      ...options,
    });
  }

  return { toastError };
}
