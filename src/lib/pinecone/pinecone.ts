import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "~/env";

const pinecone = new Pinecone({ apiKey: env.PINECONE });

const indexModel = await pinecone.describeIndex("unsuckify-songs");

export const songsIndex = pinecone.index({ host: indexModel.host });
