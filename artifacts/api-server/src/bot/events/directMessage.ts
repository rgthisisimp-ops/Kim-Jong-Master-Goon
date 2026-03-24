import { Client, Events, Message, TextChannel, ChannelType } from "discord.js";
import { logger } from "../../lib/logger.js";

export function registerDirectMessageEvent(client: Client): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    try {
      if (message.author.bot) return;
      if (message.channel.type !== ChannelType.DM) return;
      const ownerId = process.env["BOT_OWNER_ID"];
      const relayGuildId = process.env["DM_RELAY_GUILD_ID"];
      const relayChannelId = process.env["DM_RELAY_CHANNEL_ID"];
      if (!ownerId || !relayGuildId || !relayChannelId) return;
      if (message.author.id !== ownerId) return;
      const guild = client.guilds.cache.get(relayGuildId);
      if (!guild) { logger.warn({ relayGuildId }, "DM relay: guild not found"); return; }
      const channel = guild.channels.cache.get(relayChannelId) as TextChannel | undefined;
      if (!channel || !channel.isTextBased()) { logger.warn({ relayChannelId }, "DM relay: channel not found"); return; }
      const files = message.attachments.map((a) => a.url);
      await channel.send({
        ...(message.content ? { content: message.content } : {}),
        ...(files.length > 0 ? { files } : {}),
      });
      await message.react("✅").catch(() => {});
    } catch (err) {
      logger.error({ err }, "DM relay event error");
    }
  });
}
