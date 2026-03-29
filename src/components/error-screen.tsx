"use client";

import { useRouter } from "next/navigation";

type ErrorScreenProp = {
  message: string;
};

export default function ErrorScreen({ message }: ErrorScreenProp) {
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white font-mono dark:bg-black">
      <div className="w-full max-w-md px-6">
        {/* Label */}
        <p className="mb-6 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
          / Error
        </p>

        {/* Heading */}
        <h1 className="mb-8 text-4xl leading-none font-bold tracking-tight text-black uppercase dark:text-white">
          Something
          <br />
          Went Wrong.
        </h1>

        {/* Error message box */}
        <div className="mb-8 border border-black p-4 dark:border-white">
          <p className="mb-2 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            / Message
          </p>
          <p className="text-sm whitespace-pre-line text-black dark:text-white">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 border border-black bg-black py-3 text-xs font-bold tracking-widest text-white uppercase transition-opacity hover:opacity-80 dark:border-white dark:bg-white dark:text-black"
          >
            ← Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 border border-l-0 border-black bg-transparent py-3 text-xs font-bold tracking-widest text-black uppercase transition-opacity hover:opacity-60 dark:border-white dark:text-white"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
