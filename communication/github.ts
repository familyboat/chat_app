import {Octokit} from "octokit";

export class GitHubApi {
  async getAccessToken(code: string): Promise<string> {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        body: JSON.stringify({
          client_id: Deno.env.get("GITHUB_CLIENT_ID"),
          client_secret: Deno.env.get("GITHUB_CLIENT_SECRET"),
          code,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const data = await response.json();
    const accessToken = data["access_token"];
    if (typeof accessToken !== "string") {
      throw new Error("Access token was not a string");
    }
    return accessToken;
  }

  async getUserData(accessToken: string): Promise<{
    userId: number;
    userName: string;
    avatarUrl: string;
  }> {
    const octokit = new Octokit({
      auth: accessToken,
    });
    const response = await octokit.request('GET /user');
    if (response.status !== 200) {
      throw new Error(`Get user data failed: ${response.status}`)
    }
    const userData = response.data;

    return {
      userId: userData.id,
      userName: userData.login,
      avatarUrl: userData["avatar_url"],
    };
  }
}

export const gitHubApi = new GitHubApi();
