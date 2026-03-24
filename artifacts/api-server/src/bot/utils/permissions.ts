import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getGuildConfig } from "../store.js";

export async function hasCommandAccess(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const ownerId = process.env["BOT_OWNER_ID"];
  if (interaction.user.id === ownerId || interaction.user.id === interaction.guild?.ownerId) return true;
  if (!interaction.guildId) return false;
  const config = await getGuildConfig(interaction.guildId);
  if (config.allowed_role_ids.length === 0) return true;
  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return config.allowed_role_ids.some((roleId) => member.roles.cache.has(roleId));
}
