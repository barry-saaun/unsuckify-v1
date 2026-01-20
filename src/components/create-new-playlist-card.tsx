"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Globe,
  Lock,
  Music,
  Edit3,
  Check,
  X,
  List,
  Lightbulb,
  Zap,
  Heart,
  Coffee,
  Car,
  Dumbbell,
  Moon,
  CloudRain,
  Sun,
} from "lucide-react";

import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Spinner from "~/components/spinner";
import useCreatePlaylistWithTracks from "~/hooks/useCreatePlaylistWithTracks";
import { useAppToast } from "~/hooks/useAppToast";
import { useDebounce } from "use-debounce";
import { cn } from "~/lib/utils";

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
  const [showPrivacyOptions, setShowPrivacyOptions] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>("");

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

  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isCreated) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setNewPlaylistName("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCreated]);

  const hasSelectedTracks = selectedTracksUri.length > 0;
  const maxLength = 100;
  const isNearLimit = newPlaylistName.length > maxLength - 20;
  const isOverLimit = newPlaylistName.length > maxLength;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setNewPlaylistName(value);
      setInputError("");
    } else {
      setInputError(`Maximum ${maxLength} characters allowed`);
    }
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (newPlaylistName.trim() === "") {
      setNewPlaylistName("");
    }
  };

  const [suggestionIcon, setSuggestionIcon] = useState(() => {
    const icons = [
      { icon: Lightbulb, suggestion: "Based on my mood" },
      { icon: Moon, suggestion: "Late night vibes" },
      { icon: Car, suggestion: "Road trip essentials" },
      { icon: Dumbbell, suggestion: "Workout motivation" },
      { icon: Coffee, suggestion: "Chill & relax" },
      { icon: Zap, suggestion: "Monday morning energy" },
      { icon: CloudRain, suggestion: "Rainy day mood" },
      { icon: Sun, suggestion: "Summer memories" },
      { icon: Heart, suggestion: "Feel good hits" },
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  });

  // Refresh suggestion every 10 seconds when not editing
  useEffect(() => {
    if (!isEditingName && newPlaylistName.length === 0) {
      const interval = setInterval(() => {
        const icons = [
          { icon: Lightbulb, suggestion: "Based on my mood" },
          { icon: Moon, suggestion: "Late night vibes" },
          { icon: Car, suggestion: "Road trip essentials" },
          { icon: Dumbbell, suggestion: "Workout motivation" },
          { icon: Coffee, suggestion: "Chill & relax" },
          { icon: Zap, suggestion: "Monday morning energy" },
          { icon: CloudRain, suggestion: "Rainy day mood" },
          { icon: Sun, suggestion: "Summer memories" },
          { icon: Heart, suggestion: "Feel good hits" },
        ];
        setSuggestionIcon(icons[Math.floor(Math.random() * icons.length)]);
      }, 10000); // Change every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isEditingName, newPlaylistName.length]);

  const getPlaylistSuggestions = () =>
    suggestionIcon?.suggestion || "My awesome playlist";
  const getSuggestionIcon = () => suggestionIcon?.icon || Lightbulb;

  return (
    <Card className="mb-8 w-full border-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <List className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Create from selected tracks
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hasSelectedTracks
                  ? `${selectedTracksUri.length} tracks selected`
                  : "Select tracks below to get started"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <div
                  className={cn(
                    "group relative rounded-lg transition-all duration-200",
                    isEditingName &&
                      "shadow-sm ring-2 shadow-purple-500/20 ring-purple-500/50",
                  )}
                >
                  <Input
                    value={newPlaylistName}
                    onChange={handleNameChange}
                    onFocus={() => setIsEditingName(true)}
                    onBlur={handleNameBlur}
                    placeholder={
                      isEditingName
                        ? "My awesome playlist..."
                        : getPlaylistSuggestions()
                    }
                    className={cn(
                      "border-0 bg-white/70 pr-16 dark:bg-gray-800/70",
                      "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                      "focus:bg-white dark:focus:bg-gray-800",
                      "transition-all duration-200",
                      isOverLimit && "ring-2 ring-red-500/50",
                      newPlaylistName.length > 0 && "pr-20",
                    )}
                    maxLength={maxLength}
                  />

                  {/* Input status indicator */}
                  <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
                    {newPlaylistName.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setNewPlaylistName("");
                        }}
                        className="text-gray-400 transition-colors hover:scale-110 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    {isNearLimit && (
                      <span
                        className={cn(
                          "text-xs font-medium transition-colors",
                          isOverLimit
                            ? "animate-pulse text-red-500"
                            : "text-orange-500",
                        )}
                      >
                        {maxLength - newPlaylistName.length}
                      </span>
                    )}

                    <div
                      className={cn(
                        "transition-all",
                        newPlaylistName.length > 0
                          ? "text-green-500"
                          : "text-gray-400 group-hover:text-gray-600",
                      )}
                    >
                      <Edit3 className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Input feedback */}
                {inputError && (
                  <p className="mt-1 flex animate-pulse items-center gap-1 text-sm text-red-500">
                    <X className="h-3 w-3" />
                    {inputError}
                  </p>
                )}

                {/* Character counter for longer names */}
                {newPlaylistName.length > 30 && !isOverLimit && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                    {newPlaylistName.length}/{maxLength} characters
                  </p>
                )}

                {/* Smart suggestions */}
                {!isEditingName && newPlaylistName.length === 0 && (
                  <div className="mt-2 flex animate-pulse items-center gap-2">
                    {React.createElement(getSuggestionIcon(), {
                      className: "h-3 w-3 text-purple-500",
                    })}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Try: "{getPlaylistSuggestions()}"
                    </p>
                    <button
                      onClick={() => {
                        setNewPlaylistName(getPlaylistSuggestions());
                        setIsEditingName(true);
                      }}
                      className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Use this
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Playlist Privacy
                  </label>
                  <button
                    onClick={() => setShowPrivacyOptions(!showPrivacyOptions)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                      "bg-white/50 dark:bg-gray-800/50",
                      "hover:bg-white/80 dark:hover:bg-gray-700/50",
                      "border border-gray-200/50 dark:border-gray-700/50",
                      "text-gray-700 dark:text-gray-300",
                    )}
                  >
                    {isPublic ? (
                      <Globe className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    {isPublic ? "Public" : "Private"}
                    <div
                      className={cn(
                        "ml-1 h-2 w-2 rounded-full transition-all",
                        isPublic ? "bg-green-500" : "bg-orange-500",
                      )}
                    />
                  </button>
                </div>

                {showPrivacyOptions && (
                  <div className="space-y-3 rounded-lg bg-gray-50/50 p-4 dark:bg-gray-800/30">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setIsPublic(true);
                          setShowPrivacyOptions(false);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-lg p-3 text-sm transition-all",
                          isPublic
                            ? "border-2 border-green-500 bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                            : "border border-gray-200/50 bg-white/50 text-gray-600 hover:bg-white/80 dark:border-gray-600/50 dark:bg-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-700/80",
                        )}
                      >
                        <Globe className="h-5 w-5" />
                        <span className="font-medium">Public</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsPublic(false);
                          setShowPrivacyOptions(false);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-lg p-3 text-sm transition-all",
                          !isPublic
                            ? "border-2 border-orange-500 bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                            : "border border-gray-200/50 bg-white/50 text-gray-600 hover:bg-white/80 dark:border-gray-600/50 dark:bg-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-700/80",
                        )}
                      >
                        <Lock className="h-5 w-5" />
                        <span className="font-medium">Private</span>
                      </button>
                    </div>

                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                      {isPublic
                        ? "Anyone can find and listen to your playlist"
                        : "Only you can access this playlist"}
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleCreateNewPlaylist(selectedTracksUri)}
                disabled={!newPlaylistName || !hasSelectedTracks || isCreating}
                className={cn(
                  "w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                  "hover:from-purple-600 hover:to-pink-600",
                  "disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700",
                )}
              >
                {isCreating ? (
                  <Spinner />
                ) : showSuccess ? (
                  <div className="flex items-center gap-2">Created!</div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Playlist
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateNewPlaylistCard;
