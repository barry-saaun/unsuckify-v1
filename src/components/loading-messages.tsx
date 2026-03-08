import { useEffect, useState } from "react";

export const MESSAGES = [
  "We're crunching your recommendations in the factory.",
  "We're cooking something you ain't ready for.",
  "Hold tight, twin! Let it cook!",
];

export default function LoadingMessages({ interval }: { interval: number }) {
  const [currMessage, setCurrMessage] = useState(MESSAGES[2]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * MESSAGES.length);

      setCurrMessage(MESSAGES[randIdx]);
    }, interval);

    return () => clearInterval(messageInterval);
  }, [interval]);

  return (
    <p className="font-mono text-sm font-bold tracking-widest text-black uppercase dark:text-white">
      {currMessage}
    </p>
  );
}
