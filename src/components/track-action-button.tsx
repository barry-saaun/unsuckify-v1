import type { TrackStatusType } from "~/types";
import { Button } from "./ui/button";
import { Spinner } from "./Icons";
import { CheckCircle2Icon, Plus, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";

type TrackActionButtonProps = {
  actionIsPending: boolean;
  status: TrackStatusType;
  addHandler: () => void;
  removeHandler: () => void;
};

const buttonCn =
  "mx-5 flex w-full items-center justify-center gap-4  font-semibold filter transition-all  hover:brightness-125 ";

export default function TrackActionButton({
  status,
  addHandler,
  removeHandler,
  actionIsPending,
}: TrackActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (actionIsPending) {
    return (
      <Button className={buttonCn} disabled>
        <Spinner />
      </Button>
    );
  }

  switch (status) {
    case "pending":
    case "removed":
    case "failed":
      return (
        <Button className={cn(buttonCn)} onClick={addHandler}>
          <Plus />
          {"Add to Playlist"}
        </Button>
      );
    case "added":
      return (
        <Button
          className={cn(
            buttonCn,
            isHovered && "!bg-red-500/90 dark:bg-red-400/60",
          )}
          onClick={removeHandler}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered ? (
            <>
              <div className="flex flex-row items-center justify-center gap-2 text-white">
                <Trash2 /> {"Remove"}
              </div>
            </>
          ) : (
            <CheckCircle2Icon className="animate-jump-in animate-ease-out text-white transition-all" />
          )}
        </Button>
      );
    default:
      return null;
  }
}
