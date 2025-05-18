import { define } from "../../utils.ts";

export const handler = define.handlers((ctx) => {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", Deno.env.get("GITHUB_CLIENT_ID") || "");
  url.searchParams.set("redirect_uri", new URL(ctx.req.url).origin);
  return Response.redirect(url, 302);
});
