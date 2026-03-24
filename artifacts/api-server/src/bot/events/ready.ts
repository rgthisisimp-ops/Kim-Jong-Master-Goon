import { Client, Events, ActivityType } from "discord.js";
import { logger } from "../../lib/logger.js";

export function registerReadyEvent(client: Client): void {
  client.once(Events.ClientReady, (c) => {
    logger.info(`Discord bot logged in as ${c.user.tag}`);
    c.user.setPresence({
      activities: [{ name: "🛡️ Protecting the server", type: ActivityType.Watching }],
      status: "online",
    });
  });
}
