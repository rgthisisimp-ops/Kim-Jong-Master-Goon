import { Client, Events, GuildMember, TextChannel } from "discord.js";
import { getGuildConfig } from "../store.js";
import { recordJoin, isLocked } from "../tracker.js";
import { sendLog } from "../discordLogger.js";
import { logger } from "../../lib/logger.js";

const ACCOUNT_AGE_DAYS = 7;

export function registerGuildMemberAddEvent(client: Client): void {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    try {
      const config = await getGuildConfig(member.guild.id);
      if (!config.antiraid_enabled) return;
      const guild = member.guild;
      const accountAge = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
      if (isLocked(guild.id)) {
        await member.kick("Server is in lockdown mode").catch(() => {});
        await sendLog(client, guild, "Anti-Raid: Lockdown Kick", `Kicked <@${member.user.id}> because the server is in lockdown.`, "Orange", [{ name: "Account Age", value: `${accountAge.toFixed(1)} days`, inline: true }]);
        return;
      }
      if (accountAge < ACCOUNT_AGE_DAYS) {
        await sendLog(client, guild, "Anti-Raid: New Account Detected", `<@${member.user.id}> has a very new account.`, "Yellow", [
          { name: "Account Age", value: `${accountAge.toFixed(1)} days`, inline: true },
          { name: "Threshold", value: `${ACCOUNT_AGE_DAYS} days`, inline: true },
        ]);
      }
      const joinCount = recordJoin(guild.id, config.join_window_secs);
      if (joinCount >= config.join_threshold) {
        await sendLog(client, guild, "⚠️ Anti-Raid: Mass Join Detected!", `**${joinCount}** members joined within **${config.join_window_secs}** seconds. Initiating lockdown!`, "Red", [{ name: "Latest Joiner", value: `<@${member.user.id}>`, inline: true }]);
        const channels = guild.channels.cache.filter((ch) => ch.type === 0);
        for (const [, ch] of channels) {
          await (ch as TextChannel).permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
        }
        await member.kick("Anti-raid: mass join detected").catch(() => {});
        logger.warn({ guildId: guild.id, joinCount }, "Anti-raid triggered");
      }
    } catch (err) {
      logger.error({ err }, "guildMemberAdd event error");
    }
  });
}
