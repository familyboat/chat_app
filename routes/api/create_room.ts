import { getCookies } from "@std/http";
import { define } from "../../utils.ts";
import { databaseLoader } from "../../communication/database.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const accessToken = getCookies(ctx.req.headers)["deploy_chat_token"];
    if (!accessToken) {
      return new Response("Not signed in.", {
        status: 401,
      });
    }
    const name = await ctx.req.text();
    const database = await databaseLoader.getInstance();
    const roomId = await database.ensureRoom(name);

    return new Response(roomId, {
      status: 201,
    })
  }
})