import { RegisterResponse } from "./app/sub/register.ts";

/**
 * LeaderboardPlayer is a registered player in the leaderboard.
 */
export interface LeaderboardPlayer {
  /**
   * discord_id is the Discord ID of the player.
   */
  discord_id: string;

  /**
   * lc_username is the Leetcode username of the player.
   */
  lc_username: string;
}

/**
 * LeaderboardClient is the client for the leaderboard.
 */
export class LeaderboardClient {
  public constructor(
    /**
     * kv is the key-value store for the leaderboard.
     */
    private readonly kv: Deno.Kv,
  ) {}

  /**
   * registerPlayer registers the lc_username to the key and the value to the player.
   */
  public async registerPlayer(
    player: LeaderboardPlayer,
  ): Promise<RegisterResponse> {
    const key = [LeaderboardKvKey.PLAYERS, player.lc_username];
    const playerResult = await this.kv.get<LeaderboardPlayer>(key);
    if (playerResult.value) {
      throw new Error("Player already registered");
    }

    const registerResult = await this.kv
      .atomic()
      .check(playerResult)
      .set(key, player)
      .commit();
    if (!registerResult.ok) {
      throw new Error("Failed to register player");
    }
    return player;
  }
}

/**
 * LeaderboardKvKey is the key for the leaderboard key-value store.
 */
export enum LeaderboardKvKey {
  PLAYERS = "players",
}
