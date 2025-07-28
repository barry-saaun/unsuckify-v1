"use client";
import type React from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2Icon } from "lucide-react";

import CreateNewPlaylistCardPrivacySection from "./create-new-playlist-privacy-section";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Spinner from "~/components/spinner";

type CreateNewPlaylistCardProp = {
  newPlaylistId: string; // Not used in this component, consider if needed
  selectedTracksUri: string[]; // Not used in this component, consider if needed
};

const CreateNewPlaylistCard: React.FC<CreateNewPlaylistCardProp> = () => {
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(false);

  const [isCreated, setIsCreated] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Changed default state to true
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const handleCreateNewPlaylist = () => {
    // Simulate API call
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      setIsCreated(true);
      setNewPlaylistName(""); // Clear input after creation
      setIsPublic(false); // Reset privacy
      setIsOpen(false); // Optionally collapse after creation
      setTimeout(() => setIsCreated(false), 2000); // Reset 'isCreated' after a delay
    }, 1500);
  };

  return (
    <Card className="mb-8 w-full">
      <CardHeader
        className="cursor-pointer p-6 pb-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-2xl font-bold">
          Craft Your Playlist
          {isOpen ? (
            <ChevronUp className="h-6 w-6 transition-transform duration-300" />
          ) : (
            <ChevronDown className="h-6 w-6 transition-transform duration-300" />
          )}
        </CardTitle>
        {/* Hint text when collapsed */}
        {!isOpen && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Click to create a new playlist
          </p>
        )}
      </CardHeader>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
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
            onClick={handleCreateNewPlaylist}
          >
            {isCreating ? (
              <Spinner />
            ) : isCreated ? (
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
