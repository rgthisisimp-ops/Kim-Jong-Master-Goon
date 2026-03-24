import { Client, Events, GuildMember, PermissionFlagsBits } from "discord.js";
import { getGuildConfig } from "../store.js";
import { sendLog } from "../discordLogger.js";
import { logger } from "../../lib/logger.js";

const DANGEROUS_PERMS = [
  PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageWebhooks,
];

export function registerGuildMemberUpdateEvent(client: Client): void {
  client.on(Events.GuildMemberUpdate, async (oldMember: GuildMember, newMember: GuildMember) => {
    try {
      const guild = newMember.guild;
      const config = await getGuildConfig(guild.id);
      if (!config.antinuke_enabled) return;
      const ownerId = process.env["BOT_OWNER_ID"];
      const addedRoles = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
      if (addedRoles.size === 0) return;
      const dangerousRoleAdded = addedRoles.some((role) => DANGEROUS_PERMS.some((perm) => role.permissions.has(perm)));
      if (!dangerousRoleAdded) return;
      if (newMember.id === ownerId || newMember.id === guild.ownerId || config.whitelist_users.includes(newMember.id)) return;
      const auditLogs = await guild.fetchAuditLogs({ type: 25, limit: 1 }).catch(() => null);
      const executor = auditLogs?.entries.first()?.executor;
      const addedNames = addedRoles.map((r) => r.name).join(", ");
      await sendLog(client, guild, "⚠️ Anti-Nuke: Dangerous Role Granted", `<@${newMember.id}> received roles with dangerous permissions: **${addedNames}**`, "Orange", [
        { name: "Member", value: `${newMember.user.tag} (${newMember.id})`, inline: true },
        { name: "Granted By", value: executor ? `${executor.tag} (${executor.id})` : "Unknown", inline: true },
        { name: "Roles Added", value: addedNames },
      ]);
      logger.warn({ guildId: guild.id, memberId: newMember.id }, "Dangerous permission escalation detected");
    } catch (err) {
      logger.error({ err }, "guildMemberUpdate event error");
    }
  });
}
