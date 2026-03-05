import { Github } from "lucide-react";
import Link from "next/link";

const StarUs = () => {
  return (
    <Link
      href="https://github.com/barry-saaun/unsuckify-v1"
      target="_blank"
      className="flex h-12 w-12 items-center justify-center text-black transition-opacity hover:opacity-60 dark:text-white"
      title="Star us on GitHub"
    >
      <Github className="h-4 w-4" />
    </Link>
  );
};

export default StarUs;
