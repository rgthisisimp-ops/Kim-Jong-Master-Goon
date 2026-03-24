import { Client, Events, GuildBan } from "discord.js";
import { getGuildConfig } from "../store.js";
import { recordAction } from "../tracker.js";
import { sendLog } from "../discordLogger.js";
import { logger } from "../../lib/logger.js";

export function registerGuildBanAddEvent(client: Client): void {
  client.on(Events.GuildBanAdd, async (ban: GuildBan) => {
    try {
      const config = await getGuildConfig(ban.guild.id);
      if (!config.antinuke_enabled) return;
      const guild = ban.guild;
      const ownerId = process.env["BOT_OWNER_ID"];
      const auditLogs = await guild.fetchAuditLogs({ type: 22, limit: 1 }).catch(() => null);
      const entry = auditLogs?.entries.first();
      if (!entry || !entry.executor) return;
      const executor = entry.executor;
      if (executor.id === ownerId || executor.id === guild.ownerId || config.whitelist_users.includes(executor.id) || executor.id === client.user?.id) return;
      const count = recordAction(guild.id, executor.id, "ban", config.action_window_secs);
      if (count >= config.max_bans) {
        await sendLog(client, guild, "🚨 Anti-Nuke: Mass Ban Detected!", `<@${executor.id}> issued **${count}** bans within **${config.action_window_secs}** seconds!`, "Red", [
          { name: "Executor", value: `${executor.tag} (${executor.id})`, inline: true },
          { name: "Ban Target", value: ban.user.tag, inline: true },
        ]);
        const member = guild.members.cache.get(executor.id);
        if (member) {
          const roles = member.roles.cache.filter((r) => r.id !== guild.id);
          await member.roles.remove(roles, "Anti-nuke: mass ban").catch(() => {});
          await member.kick("Anti-nuke: mass ban detected").catch(() => {});
        }
        logger.warn({ guildId: guild.id, executorId: executor.id, count }, "Anti-nuke mass ban triggered");
      }
    } catch (err) {
      logger.error({ err }, "guildBanAdd event error");
    }
  });
}
