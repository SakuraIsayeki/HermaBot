import Command from "../Classes/Command";
import { commandInfos } from "../bot";
import * as Discord from "discord.js";
import config from "../config";
import { Message } from "discord.js";
import { CommandInfo } from "../Classes/CommandsDescription";

export class Help extends Command {

    readonly commandName = "help";

    constructor(message: Message) {
        super(message);
    }

    async action(bot) {
        let Embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Toutes les commandes')
            .setDescription("Liste de toutes les commandes :")
            .setTimestamp()
        let allowedCommands: Array<CommandInfo> = [];
        for (let commandInfo of commandInfos) {
            if (commandInfo.display && await commandInfo.commandClass.staticCheckPermissions(this.message, false)) {
                allowedCommands.push(commandInfo);
            }
        }
        if (allowedCommands.length == 0) {
            Embed.addFields({
                name: "Aucune commande",
                value: "On dirait que vous n'avez accès à aucune commande"
            });
        } else {
            for (let commandName of allowedCommands) {
                Embed.addFields({
                    name: config.command_prefix+commandName+" :",
                    value: commandName.msg
                });
            }
        }
        this.message.channel.send(Embed);
        return true;
    }

    async saveHistory() {} // overload saveHistory of Command class to save nothing in the history

    async checkPermissions(_: any) { // overload checkPermission of Command class to permit all users to execute the help command
        return true;
    }

    static async staticCheckPermissions(_: any) { // overload the staticCheckPermission of Command class to permit all users to execute the help command
        return true
    }
}