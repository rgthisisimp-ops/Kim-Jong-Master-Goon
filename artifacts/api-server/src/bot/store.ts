import { pool } from "@workspace/db";

export interface GuildConfig {
  guild_id: string;
  antinuke_enabled: boolean;
  antiraid_enabled: boolean;
  log_channel_id: string | null;
  join_threshold: number;
  join_window_secs: number;
  max_channels_deleted: number;
  max_roles_deleted: number;
  max_bans: number;
  action_window_secs: number;
  whitelist_users: string[];
  allowed_role_ids: string[];
}

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  const res = await pool.query(
    `INSERT INTO guild_configs (guild_id) VALUES ($1)
     ON CONFLICT (guild_id) DO UPDATE SET guild_id = EXCLUDED.guild_id
     RETURNING *`,
    [guildId]
  );
  return res.rows[0] as GuildConfig;
}

export async function updateGuildConfig(
  guildId: string,
  updates: Partial<Omit<GuildConfig, "guild_id">>
): Promise<GuildConfig> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return getGuildConfig(guildId);
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = [guildId, ...Object.values(updates)];
  const res = await pool.query(
    `UPDATE guild_configs SET ${setClause}, updated_at = NOW() WHERE guild_id = $1 RETURNING *`,
    values
  );
  if (res.rows.length === 0) {
    await getGuildConfig(guildId);
    return updateGuildConfig(guildId, updates);
  }
  return res.rows[0] as GuildConfig;
}

export interface Warning {
  id: number;
  guild_id: string;
  user_id: string;
  mod_id: string;
  reason: string;
  created_at: Date;
}

export async function addWarning(guildId: string, userId: string, modId: string, reason: string): Promise<Warning> {
  const res = await pool.query(
    `INSERT INTO warnings (guild_id, user_id, mod_id, reason) VALUES ($1,$2,$3,$4) RETURNING *`,
    [guildId, userId, modId, reason]
  );
  return res.rows[0] as Warning;
}

export async function getWarnings(guildId: string, userId: string): Promise<Warning[]> {
  const res = await pool.query(
    `SELECT * FROM warnings WHERE guild_id=$1 AND user_id=$2 ORDER BY created_at DESC`,
    [guildId, userId]
  );
  return res.rows as Warning[];
}

export async function clearWarnings(guildId: string, userId: string): Promise<number> {
  const res = await pool.query(
    `DELETE FROM warnings WHERE guild_id=$1 AND user_id=$2`,
    [guildId, userId]
  );
  return res.rowCount ?? 0;
}

export interface ModLog {
  id: number;
  guild_id: string;
  user_id: string;
  action_type: string;
  mod_id: string;
  reason: string;
  extra_info: string | null;
  created_at: Date;
}

export async function addModLog(guildId: string, userId: string, actionType: string, modId: string, reason: string, extraInfo?: string): Promise<ModLog> {
  const res = await pool.query(
    `INSERT INTO mod_logs (guild_id, user_id, action_type, mod_id, reason, extra_info) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [guildId, userId, actionType, modId, reason, extraInfo ?? null]
  );
  return res.rows[0] as ModLog;
}

export async function getModLogs(guildId: string, userId?: string, limit = 25): Promise<ModLog[]> {
  if (userId) {
    const res = await pool.query(
      `SELECT * FROM mod_logs WHERE guild_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT $3`,
      [guildId, userId, limit]
    );
    return res.rows as ModLog[];
  }
  const res = await pool.query(
    `SELECT * FROM mod_logs WHERE guild_id=$1 ORDER BY created_at DESC LIMIT $2`,
    [guildId, limit]
  );
  return res.rows as ModLog[];
}
