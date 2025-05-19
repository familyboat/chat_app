import { getCookies } from "@std/http";
import { MessageView, UserView } from "../communication/types.ts";
import { define } from "../utils.ts";
import { databaseLoader } from "../communication/database.ts";
import { page } from "fresh";
import { Page } from "../helpers/Page.tsx";
import Chat from "../islands/Chat.tsx";

interface Data {
  messages: MessageView[];
  roomName: string;
  user: UserView;
}

export const handler = define.handlers({
  async GET(ctx) {
    // Get cookie from request header and parse it
    const accessToken = getCookies(ctx.req.headers)["deploy_chat_token"];
    if (!accessToken) {
      return Response.redirect(new URL(ctx.req.url).origin);
    }
    const database = await databaseLoader.getInstance();
    const user = await database.getUserByAccessTokenOrThrow(accessToken);
    if (isNaN(+ctx.params.room)) {
      return new Response("Invalid room id", { status: 400 });
    }

    const [messages, roomName] = await Promise.all([
      database.getRoomMessages(+ctx.params.room),
      database.getRoomName(+ctx.params.room),
    ]);

    ctx.state.meta = {
      title: `${roomName} | Chat App`,
    };

    return page({
      messages,
      roomName,
      user: {
        name: user.userName,
        avatarUrl: user.avatarUrl,
      },
    });
  },
});

export default define.page<typeof handler>(function Room({ data, params }) {
  return (
    <>
      <Page>
        <Chat
          roomId={+params.room}
          initialMessages={data.messages}
          roomName={data.roomName}
          user={data.user}
        />
      </Page>
    </>
  );
});
