import type React from "react";

import CreateNewPlaylistCardPrivacySection from "./create-new-playlist-privacy-section";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Spinner from "~/components/spinner";
import { useState } from "react";
import { CheckCircle2Icon } from "lucide-react";

type CreateNewPlaylistCardProp = {
  newPlaylistId: string;
  selectedTracksUri: string[];
};

const CreateNewPlaylistCard: React.FC<CreateNewPlaylistCardProp> = ({
  newPlaylistId,
  selectedTracksUri,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(false);

  const [isCreated, setIsCreated] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleCreateNewPlaylist = () => {
    return null;
  };

  return (
    <Card className="mb-8 w-full">
      <CardContent className="space-y-5 p-6">
        <h2 className="mb-6 text-2xl font-bold">Create New Playlist</h2>
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
          disabled={!newPlaylistName}
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
    </Card>
  );
};

export default CreateNewPlaylistCard;
