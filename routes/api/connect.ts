import { getCookies } from "@std/http";
import { define } from "../../utils.ts";
import type { RouteConfig } from "fresh";
import { databaseLoader } from "../../communication/database.ts";
import { ApiSendMessage, RoomIsTypingChannelMessage, RoomTextChannelMessage } from "../../communication/types.ts";
import {emojify} from "@twuni/emojify";

const activeUsers = new Map<number, Set<WebSocket>>();

function insertActiveUserToRoom(roomId: number, user: WebSocket) {
  if (activeUsers.has(roomId)) {
    activeUsers.get(roomId)!.add(user);
  } else {
    const set = new Set<WebSocket>();
    activeUsers.set(roomId, set.add(user));
  }
}

function deleteUserFromRoom(roomId: number, user: WebSocket) {
  if (activeUsers.has(roomId)) {
    activeUsers.get(roomId)!.delete(user);
  }
}

function getAllUsersFromRoom(roomId: number): Array<WebSocket> {
  if (activeUsers.has(roomId)) {
    return Array.from(activeUsers.get(roomId)!);
  }
  return [];
}

export const handler = define.handlers({
  async GET(ctx) {
    const accessToken = getCookies(ctx.req.headers)["deploy_chat_token"];
    if (!accessToken) {
      return new Response("Not signed in.", {
        status: 401,
      });
    }

    if (ctx.req.headers.get("upgrade") !== "websocket") {
      return new Response(null, { status: 501 });
    }

    // TODO: be sure that roomId is valid
    const roomId = ctx.params.room;
    const { socket, response } = Deno.upgradeWebSocket(ctx.req);
    const database = await databaseLoader.getInstance();
    const user = await database.getUserByAccessTokenOrThrow(accessToken);
    const from = {
      name: user.userName,
      avatarUrl: user.avatarUrl,
    }
    socket.addEventListener('open', () => {
      insertActiveUserToRoom(+roomId, socket);
    })
    socket.addEventListener("message", async (e) => {
      const data = JSON.parse(e.data) as ApiSendMessage;
      const users = getAllUsersFromRoom(+roomId);

      if (data.kind === 'isTyping') {
        const msg: RoomIsTypingChannelMessage = {
          kind: 'isTyping',
          from,
        }
        users.forEach((user) => {
          user.send(JSON.stringify(msg));
        })
      } else if (data.kind === 'text') {
        const message = emojify(data.message)
        const msg: RoomTextChannelMessage = {
          kind: 'text',
          message,
          from,
          createdAt: new Date().toISOString(),
        }
        users.forEach((user) => {
          user.send(JSON.stringify(msg))
        });
        await database.insertMessage({
          text: message,
          roomId: data.roomId,
          userId: user.userId,
        })
      }
      socket.addEventListener('close', () => {
        deleteUserFromRoom(+roomId, socket);
      })
    });

    return response;
  },
});

export const config: RouteConfig = {
  routeOverride: "/api/connect/:room",
};
