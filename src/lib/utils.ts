import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRandomString(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter((word) => word.length > 0) // Filter out empty strings
    .map((word) => word[0].toUpperCase())
    .join("");
}

export function assertError(error: string, status_code: number) {
  return Response.json({ error }, { status: status_code });
}
