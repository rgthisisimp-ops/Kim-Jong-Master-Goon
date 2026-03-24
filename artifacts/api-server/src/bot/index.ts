import { Client, GatewayIntentBits, Partials } from "discord.js";
import { logger } from "../lib/logger.js";
import { registerReadyEvent } from "./events/ready.js";
import { registerGuildMemberAddEvent } from "./events/guildMemberAdd.js";
import { registerGuildBanAddEvent } from "./events/guildBanAdd.js";
import { registerChannelDeleteEvent } from "./events/channelDelete.js";
import { registerRoleDeleteEvent } from "./events/roleDelete.js";
import { registerGuildMemberUpdateEvent } from "./events/guildMemberUpdate.js";
import { registerInteractionCreateEvent } from "./events/interactionCreate.js";
import { registerDirectMessageEvent } from "./events/directMessage.js";
import { registerPrefixCommandsEvent } from "./events/prefixCommands.js";
import { registerCommands } from "./register.js";

export async function startBot(): Promise<void> {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_TOKEN not set — skipping Discord bot startup");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildBans,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  registerReadyEvent(client);
  registerGuildMemberAddEvent(client);
  registerGuildBanAddEvent(client);
  registerChannelDeleteEvent(client);
  registerRoleDeleteEvent(client);
  registerGuildMemberUpdateEvent(client);
  registerInteractionCreateEvent(client);
  registerDirectMessageEvent(client);
  registerPrefixCommandsEvent(client);

  await client.login(token);

  client.once("ready", async (c) => {
    try {
      await registerCommands(c.user.id, token);
    } catch (err) {
      logger.error({ err }, "Command registration failed");
    }
  });
}
