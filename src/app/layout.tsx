import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import NavBar from "~/components/nav-bar";
import { ThemeProvider as NextThemeProvider } from "~/components/theme-provider";
import ToasterProvider from "~/components/toaster-provider";
import { AuthErrorProvider } from "~/components/auth-error-provider";
import SessionExpiredAlertDialog from "~/components/session-expired-alert-dialog";
import { UserProvider } from "~/components/user-context-provider";

export const metadata: Metadata = {
  title: "UNSUCKify",
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
    <html
      lang="en"
      className={`${geist.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden">
        <AuthErrorProvider>
          <TRPCReactProvider>
            <UserProvider>
              <NextThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
              >
                <SessionExpiredAlertDialog />
                <ToasterProvider />
                <div className="flex h-full flex-col">
                  <NavBar />
                  <main className="min-h-0 flex-1 overflow-y-auto">
                    {children}
                  </main>
                </div>
              </NextThemeProvider>
            </UserProvider>
          </TRPCReactProvider>
        </AuthErrorProvider>
      </body>
    </html>
  );
}
