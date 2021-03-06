import { listener, databaseProvider, ModlogReason } from "#lib";

import type { Interaction } from "discord.js";
import { Listener } from "discord-akairo";

@listener("undoAction", {
  emitter: "client",
  event: "interactionCreate"
})
export default class extends Listener {
  public async exec(interaction: Interaction) {
    if (!interaction.isButton()) return;

    const { message, guild, customId, user } = interaction;
    if (customId !== "undo-action" || !guild || interaction.deferred) return;

    await interaction.deferReply({ ephemeral: true });

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member?.permissions.has("MANAGE_MESSAGES"))
      return interaction.editReply("You do not have permission to undo actions");

    const modlog = await databaseProvider.helpers.findModlogByMessageId(message.id);
    if (!modlog) return interaction.editReply("Modlog not found.");

    const undo = await this.client.mod.actions
      .undo(modlog.id, ModlogReason.UNDO)
      .catch(() => null);

    if (!undo) return interaction.editReply("Unable to perform action on this user.");
    return interaction.editReply("Successfully undone action.");
  }
}
