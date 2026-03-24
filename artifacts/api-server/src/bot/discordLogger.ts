import { Client, EmbedBuilder, TextChannel, Colors, Guild } from "discord.js";
import { getGuildConfig } from "./store.js";
import { logger } from "../lib/logger.js";

export type LogColor = "Red" | "Orange" | "Yellow" | "Green" | "Blue" | "Purple";

const colorMap: Record<LogColor, number> = {
  Red: Colors.Red, Orange: Colors.Orange, Yellow: Colors.Yellow,
  Green: Colors.Green, Blue: Colors.Blue, Purple: Colors.Purple,
};

export async function sendLog(client: Client, guild: Guild, title: string, description: string, color: LogColor = "Blue", fields?: { name: string; value: string; inline?: boolean }[]): Promise<void> {
  try {
    const config = await getGuildConfig(guild.id);
    if (!config.log_channel_id) return;
    const channel = guild.channels.cache.get(config.log_channel_id) as TextChannel | undefined;
    if (!channel || !channel.isTextBased()) return;
    const embed = new EmbedBuilder()
      .setTitle(`🛡️ ${title}`)
      .setDescription(description)
      .setColor(colorMap[color])
      .setTimestamp();
    if (fields) embed.addFields(fields);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error({ err }, "Failed to send discord log");
  }
}
