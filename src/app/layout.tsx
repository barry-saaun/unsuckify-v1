import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import NavBar from "~/components/nav-bar";
import { ThemeProvider as NextThemeProvider } from "~/components/theme-provider";
import { Toaster } from "sonner";
import ToasterProvider from "~/components/toaster-provider";
import { AuthErrorProvider } from "~/components/auth-error-provider";
import SessionExpiredAlertDialog from "~/components/session-expired-alert-dialog";

export const metadata: Metadata = {
  title: "🥟 UNSUCKify",
  description: "Make your favourite playlist less sucks.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <AuthErrorProvider>
          <TRPCReactProvider>
            <NextThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SessionExpiredAlertDialog />
              <ToasterProvider />
              <NavBar />
              {children}
            </NextThemeProvider>
          </TRPCReactProvider>
        </AuthErrorProvider>
      </body>
    </html>
  );
}
