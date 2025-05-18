import * as supabase from "@supabase/supabase-js";
import { MessageView } from "./types.ts";
import { ResourceLoader } from "../helpers/loader.ts";

export interface DatabaseUser {
  userId: number,
  userName: string,
  avatarUrl: string,
}

export class Database {
  #client: supabase.SupabaseClient;

  constructor(client?: supabase.SupabaseClient) {
    this.#client = client ?? supabase.createClient(
      Deno.env.get("SUPABASE_API_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    )
  }

  async insertUser(user: DatabaseUser & {
    accessToken: string
  }) {
      const {error} = await this.#client.from("users")
      .upsert([{
        id: user.userId,
        username: user.userName,
        avatar_url: user.avatarUrl,
        access_token: user.accessToken,
      }]);
      if (error) {
        throw new Error(error.message);
      }
  }

  async getUserByAccessTokenOrThrow(accessToken: string): Promise<DatabaseUser> {
    const user = await this.getUserByAccessToken(accessToken);
    if (user == null) {
      throw new Error("Could not find user with access token.");
    }
    return user;
  }

  async getUserByAccessToken(accessToken: string): Promise<DatabaseUser | undefined> {
    const {data, error} = await this.#client
    .from("users")
    .select("id,username,avatar_url")
    .eq("access_token", accessToken);
    if (error) {
      throw new Error(error.message)
    }
    if (data.length === 0) {
      return undefined
    }
    return {
      userId: data[0].id,
      userName: data[0].username,
      avatarUrl: data[0].avatar_url,
    }
  }

  async getRooms() {
    const {data, error} = await this.#client.from("rooms_with_activity")
    .select("id,name,last_message_at");
    if (error) {
      throw new Error(error.message);
    }
    return data.map((d) => ({
      roomId: d.id,
      name: d.name,
      lastMessageAt: d.last_message_at,
    }));
  }

  async getRoomName(roomId: number): Promise<string> {
    const {data, error} = await this.#client.from("rooms").
    select("name")
    .eq("id", roomId)
    if (error) {
      throw new Error(error.message)
    }
    return data[0].name
  }

  async ensureRoom(name: string) {
    const insert = await this.#client.from("rooms").insert([{name}]).select();
    if (insert.error) {
      if (insert.error.code !== "23505") {
        throw new Error(insert.error.message)
      }
      const get = await this.#client.from("rooms").select("id").eq("name", name);
      if (get.error) {
        throw new Error(get.error.message)
      }
      return get.data[0].id
    }

    return insert.data![0].id
  }

  async insertMessage(
    message: {text: string, roomId: number, userId: number}
  ) {
    await this.#client.from("messages")
    .insert([{
      message: message.text,
      room: message.roomId,
      from: message.userId,
    }])
  }

  async getRoomMessages(roomId: number): Promise<MessageView[]>{
    const {data, error} = await this.#client.from("messages")
    .select("message,from(username,avatar_url),created_at")
    .eq("room", roomId);
    if (error) {
      throw new Error(error.message)
    }
    return data.map((m) => ({
      message: m.message,
      from: {
        name: m.from.username,
        avatarUrl: m.from.avatar_url
      },
      createdAt: m.created_at
    }))
  }
}

export const databaseLoader = new ResourceLoader<Database>({
  load() {
    return Promise.resolve(new Database());
  }
})
