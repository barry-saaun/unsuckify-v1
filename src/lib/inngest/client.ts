import { EventSchemas, Inngest } from "inngest";
import type { InngestEvents } from "~/app/api/inngest/types";

export const inngest = new Inngest({
  id: "unsuckify",
  schemas: new EventSchemas().fromRecord<InngestEvents>(),
});
