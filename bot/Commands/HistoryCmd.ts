import config from "../config";
import Command from "../Classes/Command";
import { getHistory } from "../Classes/OtherFunctions";
import Discord, {Message} from "discord.js";

export class HistoryCmd extends Command {

    readonly commandName = "history";

    constructor(message: Message) {
        super(message);
    }

    async action(bot) {
        const args = this.parseCommand();

        if (args[0] == "help") {
            this.displayHelp();
            return false;
        }

        if (this.message.guild == null) {
            this.sendErrors({
                name: "Guild missing",
                value: "We cannot find the message guild"
            });
            return false;
        }

        const response = await getHistory(this.message,args);

        if (response.errors.length > 0) {
            this.sendErrors(response.errors);
            return false;
        }

        const histories = response.histories;

        let Embeds: Array<any> = [];
        let Embed;

        if (histories.length > 0) {
            for (let i=0;i<histories.length;i++) {
                if (i % 50 == 0) {
                    Embed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle("L'historique des commandes (Partie "+((i/50)+1)+") "+(<number>response.limit > 0 ? "(limité à "+response.limit+")" : "(Sans limite)")+" :")
                        .setDescription("Liste des commandes qui ont été tapées :")
                        .setTimestamp();
                    Embeds.push(Embed);
                }
                const history = histories[i];
                const user = this.message.guild.members.cache.get(history.userId);
                const channel = this.message.guild.channels.cache.get(history.channelId);

                const userName = user != undefined ? user.nickname : "unknown";
                const channelName = channel != undefined ? channel.name : "unknown"

                Embed.addFields({
                    name: "[" + history.dateTime + "] "+userName+" sur #"+channelName+" :",
                    value: config.command_prefix+history.command
                });
            }
        } else {
            Embeds.push(new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle("L'historique des commandes :")
                .setDescription("Liste des commandes qui ont été tapées :")
                .setTimestamp()
                .addFields({
                    name: "Aucun historique",
                    value: "Aucun élément n'a été trouvé dans l'historique"
                }));
        }
        for (let Embed of Embeds) {
            this.message.channel.send(Embed);
        }
        return true;
    }

    help(Embed) {
        Embed.addFields({
            name: "Arguments :",
            value: "-c ou --command, la commande dont on souhaite voir l'historique\n"+
                "-s ou --sort, 'asc' ou 'desc/dsc' ('asc' par défaut) pour trier du debut à la fin ou de la fin au début dans l'ordre chronologique\n"+
                "-l ou --limit, Pour afficher les n premières commandes de la listes\n"+
                "-ch ou --channel, Pour afficher les commandes executées dans un channel spécifique\n"+
                "-u ou --user, Pour afficher les commandes executées par un utilisateur spécifique"
        }).addFields({
                name: "Exemples :",
                value: config.command_prefix+"history --command notifyOnReact -l 10 --channel #blabla"
            })
    }

    saveHistory() {} // overload saveHistory of Command class to save nothing in the history
}