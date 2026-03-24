import { Client, Events, Interaction, ChatInputCommandInteraction } from "discord.js";
import { logger } from "../../lib/logger.js";
import { hasCommandAccess } from "../utils/permissions.js";
import { handleWarn, handleWarnings, handleClearWarnings, handleKick, handleBan, handleUnban, handleMute, handleUnmute, handlePurge, handleSlowmode } from "../commands/moderation.js";
import { handleAntinuke, handleAntiraid, handleLockdown, handleUnlock, handleWhitelist, handleSetlog } from "../commands/security.js";
import { handleModlog, handleUserinfo, handleServerinfo, handlePing } from "../commands/info.js";

const handlers: Record<string, (i: ChatInputCommandInteraction) => Promise<void>> = {
  warn: handleWarn, warnings: handleWarnings, clearwarnings: handleClearWarnings,
  kick: handleKick, ban: handleBan, unban: handleUnban,
  mute: handleMute, unmute: handleUnmute, purge: handlePurge, slowmode: handleSlowmode,
  antinuke: handleAntinuke, antiraid: handleAntiraid,
  lockdown: handleLockdown, unlock: handleUnlock,
  whitelist: handleWhitelist, setlog: handleSetlog,
  modlog: handleModlog, userinfo: handleUserinfo, serverinfo: handleServerinfo, ping: handlePing,
};

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const handler = handlers[interaction.commandName];
    if (!handler) return;
    try {
      const allowed = await hasCommandAccess(interaction);
      if (!allowed) {
        await interaction.reply({ content: "❌ You don't have a role that is allowed to use bot commands.", ephemeral: true });
        return;
      }
      await handler(interaction);
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Command handler error");
      const errMsg = { content: "❌ An error occurred executing this command.", ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(errMsg).catch(() => {});
      else await interaction.reply(errMsg).catch(() => {});
    }
  });
}
