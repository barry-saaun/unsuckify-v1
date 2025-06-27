"use client";

import { useRouter } from "next/navigation";

type ErrorScreenProp = {
  message: string;
};

export default function ErrorScreen({ message }: ErrorScreenProp) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-gray-100 dark:bg-gray-900">
      <div className="mb-8 text-6xl">😕</div>

      <h1 className="mb-4 text-3xl font-bold text-black dark:text-white">
        Oops! Couldn&apos;t load that playlist.
      </h1>

      <p className="mb-6 text-center text-lg text-gray-400">{message}</p>

      <div className="flex flex-col gap-3">
        <button
          className="rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold transition-colors hover:cursor-pointer hover:bg-indigo-700"
          onClick={() => router.back()}
        >
          Go back
        </button>
      </div>
    </div>
  );
}
