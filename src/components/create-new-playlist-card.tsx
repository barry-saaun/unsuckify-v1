"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, CheckCircle2Icon } from "lucide-react";

import CreateNewPlaylistCardPrivacySection from "./create-new-playlist-privacy-section";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Spinner from "~/components/spinner";
import useCreatePlaylistWithTracks from "~/hooks/useCreatePlaylistWithTracks";
import { useAppToast } from "~/hooks/useAppToast";
import { useDebounce } from "use-debounce";

type CreateNewPlaylistCardProp = {
  selectedTracksUri: string[];
  user_id: string;
};

const CreateNewPlaylistCard: React.FC<CreateNewPlaylistCardProp> = ({
  user_id,
  selectedTracksUri,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [debouncePlaylistName] = useDebounce(newPlaylistName, 500);

  const [isPublic, setIsPublic] = useState<boolean>(false);

  const [isSectionOpen, setIsSectionOpen] = useState<boolean>(true);

  const { isCreated, isCreating, error, handleCreateNewPlaylist } =
    useCreatePlaylistWithTracks({
      isPublic,
      newPlaylistName: debouncePlaylistName,
      user_id,
    });

  const { toastError } = useAppToast();

  if (error) {
    toastError(error.message, {
      id: "error-creating-playist-with-tracks",
    });
  }

  const [showSuccessIcon, setShowSuccessIcon] = useState<boolean>(false);

  useEffect(() => {
    if (isCreated) {
      setShowSuccessIcon(true);
      const timer = setTimeout(() => {
        setShowSuccessIcon(false);
      }, 3000); // 3000 milliseconds = 3 seconds

      // Cleanup the timeout if the component unmounts or isCreated changes
      return () => clearTimeout(timer);
    }
  }, [isCreated]); // Re-run effect when isCreated changes

  return (
    <Card className="mb-8 w-full">
      <CardHeader
        className="cursor-pointer p-6 pb-0"
        onClick={() => setIsSectionOpen(!isSectionOpen)}
      >
        <CardTitle className="flex items-center justify-between text-2xl font-bold">
          Craft Your Playlist
          {isSectionOpen ? (
            <ChevronUp className="h-6 w-6 transition-transform duration-300" />
          ) : (
            <ChevronDown className="h-6 w-6 transition-transform duration-300" />
          )}
        </CardTitle>
        {/* Hint text when collapsed */}
        {!isSectionOpen && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Click to create a new playlist
          </p>
        )}
      </CardHeader>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isSectionOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <CardContent className="space-y-5 overflow-hidden p-6 pt-5">
          <div>
            <Label
              htmlFor="playlist-name"
              className="mb-2 block text-sm font-semibold"
            >
              Playlist Name
            </Label>
            <Input
              id="playlist-name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="w-full"
            />
          </div>
          <CreateNewPlaylistCardPrivacySection
            isPublic={isPublic}
            onPrivacyChange={setIsPublic}
          />
          <Button
            className="flex w-full items-center justify-center font-semibold disabled:cursor-not-allowed"
            disabled={!newPlaylistName || isCreating}
            onClick={() => handleCreateNewPlaylist(selectedTracksUri)}
          >
            {isCreating ? (
              <Spinner />
            ) : showSuccessIcon ? ( // Use showSuccessIcon here
              <CheckCircle2Icon className="animate-jump-in animate-ease-out transition-all" />
            ) : (
              "Create playlist"
            )}
          </Button>
        </CardContent>
      </div>
    </Card>
  );
};

export default CreateNewPlaylistCard;
