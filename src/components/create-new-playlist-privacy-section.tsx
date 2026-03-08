import { Globe, Lock } from "lucide-react";
import type React from "react";
import { cn } from "~/lib/utils";

type CreateNewPlaylistCardPrivacySectionProp = {
  isPublic: boolean;
  onPrivacyChange: (isPublic: boolean) => void;
};

const CreateNewPlaylistCardPrivacySection: React.FC<
  CreateNewPlaylistCardPrivacySectionProp
> = ({ isPublic, onPrivacyChange }) => {
  const HELPER_TEXT = isPublic
    ? "Your playlist will be visible to everyone."
    : "Only you can see this playlist.";

  return (
    <div className="flex flex-col space-y-5">
      <div role="group" className="flex rounded-md shadow-sm">
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-2 rounded-l-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out focus:z-10 focus:ring-2 focus:ring-blue-500",
            isPublic
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-gray-300 bg-white text-blue-500 hover:bg-blue-50",
          )}
          onClick={() => onPrivacyChange(true)}
          aria-pressed={isPublic}
        >
          <Globe className="h-4 w-4" />
          <h1 className={cn(isPublic ? "font-bold" : "font-normal")}>Public</h1>
        </button>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-2 rounded-r-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out focus:z-10 focus:ring-2 focus:ring-green-500",
            !isPublic
              ? "border-green-500 bg-green-500 text-white"
              : "border-gray-300 bg-white text-green-500 hover:bg-green-50",
          )}
          onClick={() => onPrivacyChange(false)}
          aria-pressed={!isPublic}
        >
          <Lock className="h-4 w-4" />
          <h1 className={cn(!isPublic ? "font-bold" : "font-normal")}>
            Private
          </h1>
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-300">{HELPER_TEXT}</p>
    </div>
  );
};

export default CreateNewPlaylistCardPrivacySection;
