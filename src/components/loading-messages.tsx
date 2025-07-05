import { useEffect, useState } from "react";

export const MESSAGES = [
  "We're crunching your recommendations in the factory.",
  "We're cooking something you ain't ready for.",
  "Hold tight, twin! Let the AI cook!",
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

  return <h1 className="font-semibold">{currMessage}</h1>;
}
