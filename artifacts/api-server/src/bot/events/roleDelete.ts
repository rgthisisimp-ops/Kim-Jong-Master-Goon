import { Client, Events, Role } from "discord.js";
import { getGuildConfig } from "../store.js";
import { recordAction } from "../tracker.js";
import { sendLog } from "../discordLogger.js";
import { logger } from "../../lib/logger.js";

export function registerRoleDeleteEvent(client: Client): void {
  client.on(Events.GuildRoleDelete, async (role: Role) => {
    try {
      const guild = role.guild;
      const config = await getGuildConfig(guild.id);
      if (!config.antinuke_enabled) return;
      const ownerId = process.env["BOT_OWNER_ID"];
      const auditLogs = await guild.fetchAuditLogs({ type: 32, limit: 1 }).catch(() => null);
      const entry = auditLogs?.entries.first();
      if (!entry || !entry.executor) return;
      const executor = entry.executor;
      if (executor.id === ownerId || executor.id === guild.ownerId || config.whitelist_users.includes(executor.id) || executor.id === client.user?.id) return;
      const count = recordAction(guild.id, executor.id, "role_delete", config.action_window_secs);
      if (count >= config.max_roles_deleted) {
        await sendLog(client, guild, "🚨 Anti-Nuke: Mass Role Delete!", `<@${executor.id}> deleted **${count}** roles within **${config.action_window_secs}** seconds!`, "Red", [
          { name: "Executor", value: `${executor.tag} (${executor.id})`, inline: true },
          { name: "Role", value: role.name, inline: true },
        ]);
        const member = guild.members.cache.get(executor.id);
        if (member) {
          const roles = member.roles.cache.filter((r) => r.id !== guild.id);
          await member.roles.remove(roles, "Anti-nuke").catch(() => {});
          await member.kick("Anti-nuke: mass role delete").catch(() => {});
        }
        logger.warn({ guildId: guild.id, executorId: executor.id, count }, "Anti-nuke mass role delete triggered");
      }
    } catch (err) {
      logger.error({ err }, "roleDelete event error");
    }
  });
}
