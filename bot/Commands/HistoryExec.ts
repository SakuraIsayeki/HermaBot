import Command from "../Classes/Command";
import config from "../config";
import {getHistory} from "../Classes/OtherFunctions";
import {Message} from "discord.js";

export class HistoryExec extends Command {

    readonly commandName = "historyExec";

    constructor(message: Message) {
        super(message);
    }


    async action(bot) {

        const args = this.parseCommand();

        if (args[0] == "help") {
            this.displayHelp();
            return false;
        }

        const response = await getHistory(this.message,args);

        if (response.errors.length > 0) {
            this.sendErrors(response.errors);
            return false;
        }

        const histories = response.histories;

        this.message.channel.send("Execute : ");

        if (histories.length > 0) {
            for (let history of histories) {
                this.message.channel.send(config.command_prefix+history.command);
            }
        } else {
            this.message.channel.send("Aucune commande trouvée")
        }

        return true;
    }

    saveHistory() {} // overload saveHistory of Command class to save nothing in the history

    help(Embed) {
        Embed.addFields({
            name: "Arguments :",
            value: "-c ou --command, la commande dont on souhaite executer l'historique\n"+
                "-s ou --sort, 'asc' ou 'desc/dsc' ('asc' par défaut) pour trier du debut à la fin ou de la fin au début dans l'ordre chronologique\n"+
                "-l ou --limit, Pour executer les n premières commandes de la listes\n"+
                "-ch ou --channel, Pour éxecuté les commandes ayant été executées dans un channel spécifique\n"+
                "-u ou --user, Pour éxecuter les commandes ayant été executées par un utilisateur spécifique"
        }).addFields({
            name: "Exemples :",
            value: config.command_prefix+"historyExec --command notifyOnReact -l 10 --channel #blabla"
        })
    }
}