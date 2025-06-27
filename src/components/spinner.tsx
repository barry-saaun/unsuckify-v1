import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

type SpinnerProps = {
  extraCN?: string;
};

const Spinner = ({ extraCN }: SpinnerProps) => {
  return (
    <Loader2
      className={cn("text-muted-foreground h-5 w-5 animate-spin", extraCN)}
    />
  );
};

export default Spinner;
