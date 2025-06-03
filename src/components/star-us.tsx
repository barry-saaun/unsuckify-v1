import { Github } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { Button } from "./ui/button";
import Link from "next/link";

const StarUs = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="https://github.com/barry-saaun/unsuckify-v1"
            target="_blank"
          >
            <Button variant={"ghost"} className="h-9 w-9">
              <Github fill="white" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="flex w-24 items-center justify-center px-1 py-2">
          Star Us
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StarUs;
