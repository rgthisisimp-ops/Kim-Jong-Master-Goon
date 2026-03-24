import { REST, Routes } from "discord.js";
import { logger } from "../lib/logger.js";
import { warnCommand, warningsCommand, clearWarningsCommand, kickCommand, banCommand, unbanCommand, muteCommand, unmuteCommand, purgeCommand, slowmodeCommand } from "./commands/moderation.js";
import { antinukeCommand, antiraidCommand, lockdownCommand, unlockCommand, whitelistCommand, setlogCommand } from "./commands/security.js";
import { modlogCommand, userinfoCommand, serverinfoCommand, pingCommand } from "./commands/info.js";

const commands = [
  warnCommand, warningsCommand, clearWarningsCommand, kickCommand, banCommand,
  unbanCommand, muteCommand, unmuteCommand, purgeCommand, slowmodeCommand,
  antinukeCommand, antiraidCommand, lockdownCommand, unlockCommand,
  whitelistCommand, setlogCommand, modlogCommand, userinfoCommand,
  serverinfoCommand, pingCommand,
].map((c) => c.toJSON());

export async function registerCommands(clientId: string, token: string): Promise<void> {
  const rest = new REST().setToken(token);
  try {
    logger.info(`Registering ${commands.length} slash commands globally...`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    logger.info("Slash commands registered successfully.");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
    throw err;
  }
}
