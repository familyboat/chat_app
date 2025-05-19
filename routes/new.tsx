import { define } from "../utils.ts";
import { page } from "fresh";
import { Page } from "../helpers/Page.tsx";
import AddRoom from "../islands/AddRoom.tsx";
import { getCookies } from "@std/http";

export const handler = define.handlers({
  GET(ctx) {
  // Get cookie from request header and parse it
  const accessToken = getCookies(ctx.req.headers)["deploy_chat_token"];
  if (!accessToken) {
    return Response.redirect(new URL(ctx.req.url).origin);
  }
    ctx.state.meta = {
      title: "New Room | Chat App",
    };

  return page();
  }
})

export default define.page<typeof handler>(function NewRoom() {
  return (
    <>
      <Page>
        <div class="rounded-2xl w-5/6 md:w-5/12 max-w-xl pt-4 pb-8 px-7">
          <div class="h-8 flex-none flex justify-between items-center mb-9">
            <a
              href="/"
              class="h-8 w-8 p-2 flex items-center justify-center hover:bg-gray-200 rounded-2xl"
            >
              <img src="/arrow.svg" alt="Left Arrow" />
            </a>
            <div class="font-medium text-lg flex items-center">
              <div class="w-6 h-6 flex justify-center items-center mr-1.5">
                <img src="/plus.svg" alt="Plus" />
              </div>
              New Room
            </div>
            <div />
          </div>
          <AddRoom />
        </div>
      </Page>
    </>
  );
});
