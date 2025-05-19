import type {
  ApiIsTypingMessage,
  ApiTextMessage,
  ChannelMessage,
} from "./types.ts";

export class Client {
  #socket: WebSocket | null = null;

  subscribeMessages(
    roomId: number,
    onMessage: (message: ChannelMessage) => void,
  ) {
    const socket = this.#socket = new WebSocket(`/api/connect/${roomId}`);
    const listener = (e: MessageEvent) => {
      const msg = JSON.parse(e.data) as ChannelMessage;
      onMessage(msg);
    };
    socket.addEventListener("message", listener);
    return {
      unsubscribe() {
        socket.removeEventListener("message", listener);
        // TODO: close socket?
      },
    };
  }

  sendMessage(roomId: number, message: string) {
    if (this.#socket) {
      const data: ApiTextMessage = {
        kind: "text",
        message,
        roomId,
      };
      this.#socket.send(JSON.stringify(data));
    } else {
      throw new Error(
        "Please call this.subscribeMessages() function before calling it",
      );
    }
  }

  sendIsTyping(roomId: number) {
    if (this.#socket) {
      const data: ApiIsTypingMessage = {
        kind: "isTyping",
        roomId,
      };
      this.#socket.send(JSON.stringify(data));
    } else {
      throw new Error(
        "Please call this.subscribeMessages() function before calling it",
      );
    }
  }

  static async createRoom(name: string) {
    const res = await fetch("/api/create_room", {
      method: "POST",
      body: name,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text);
    }
    return text;
  }
}
