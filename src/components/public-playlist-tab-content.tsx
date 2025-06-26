"use client";
import { type FieldErrors, useForm } from "react-hook-form";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Input } from "./ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const FormSchema = z.object({
  url: z
    .string()
    .min(1, { message: "Oops! The playlist URL field can’t be empty." })
    .regex(
      /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+(\?si=[a-zA-Z0-9]+)?$|^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+$/,
      { message: "Invalid Spotify Playlist URL." },
    ),
});

function PublicPlaylistTabContent() {
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      url: "",
    },
  });

  const urlValue = form.watch("url");
  const isFormEmpty = !urlValue || urlValue.trim() === "";

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const playlistUrlObject = FormSchema.safeParse(data);

    const playlistUrl = playlistUrlObject.data?.url;

    const playlist_id = playlistUrl?.split("?si")[0].split("playlist/")[1];
    router.push(`/dashboard/${playlist_id}`);
  };

  const errorOnSubmit = (errors: FieldErrors<z.infer<typeof FormSchema>>) => {
    const errorMessage = errors?.url;
    if (errorMessage) {
      toast.error(` 😩 ${errorMessage.message}`);
    }
  };

  return (
    <div className="container flex w-full flex-grow items-center justify-center rounded-lg md:w-2/3 md:justify-start">
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="text-2xl">
            Recommendation of a Public Playlist
          </CardTitle>
          <CardDescription>
            Enter a public Spotify playlist URL to get songs recommendation and
            JSON data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) =>
                errorOnSubmit(errors),
              )}
              className="flex items-center justify-between space-x-5"
            >
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="w-[90%]">
                    <FormControl>
                      <Input
                        placeholder="https://open.spotify.com/playlist/..."
                        className="text-sm font-medium"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="cursor-pointer font-bold disabled:cursor-not-allowed"
                disabled={isFormEmpty}
              >
                UNSUCKify
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default PublicPlaylistTabContent;
