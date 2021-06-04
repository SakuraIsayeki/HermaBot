import Command from "../Classes/Command";
import config from "../config";
import TicketConfig, {ITicketConfig} from "../Models/TicketConfig";
import {extractUserId} from "../Classes/OtherFunctions";
import Discord, {Message} from "discord.js";

export class ConfigTicket extends Command {

    readonly commandName = "configTicket";

    constructor(message: Message) {
        super(message);
    }

    async action(bot) {
        let args = this.parseCommand();
        if (!args) return false;

        if (this.message.guild == null || this.message.member == null) {
            this.sendErrors({
                name: "Datas missing",
                value: "Nor message guild nor message membre has been found"
            });
            return false;
        }

        if (typeof(args[0]) == "undefined") {
            this.sendErrors({
                name: "Argument missing",
                value: "Please specify 'set', 'show', 'enable', 'disable' or 'help'"
            });
            return false;
        }

        let ticketConfig: ITicketConfig;
        let category;

        switch(args[0]) {
            case "help":
                this.displayHelp();
                return false;
            case "set":
                if (typeof(args[1]) == "undefined") {
                    this.sendErrors({
                        name: "Argument missing",
                        value: "You need to specify the id of the category channel which will be user for the tickets"
                    });
                    return false;
                }
                const categoryId = args[1];
                category = this.message.guild.channels.cache.get(categoryId);
                if (category == undefined) {
                    this.sendErrors({
                        name: "Bad id",
                        value: "The specified id channel does not exist"
                    });
                    return false;
                }
                if (category.type != "category") {
                    this.sendErrors({
                        name: "Bad id",
                        value: "The specified channel is not a category"
                    });
                    return false;
                }
                ticketConfig = await TicketConfig.findOne({serverId: this.message.guild.id});
                let toEnable = false;
                if (ticketConfig == null) {
                    toEnable = true;
                    ticketConfig = {
                        enabled: true,
                        categoryId: categoryId,
                        serverId: this.message.guild.id,
                        blacklist: []
                    }
                    TicketConfig.create(ticketConfig);
                } else {
                    if (ticketConfig.categoryId == null)  {
                        toEnable = true;
                        ticketConfig.enabled = true;
                    }
                    ticketConfig.categoryId = categoryId; // @ts-ignore
                    ticketConfig.save();
                }
                this.message.channel.send("Ce sera dorénavant dans la catégorie '"+category.name+"' que seront gérés les tickets"+
                    (toEnable ?  "\n(La fonctionnalité des tickets a été activée)" : ""));
                return true;
            case "show":
                ticketConfig = await TicketConfig.findOne({serverId: this.message.guild.id, categoryId: { $ne: null }});
                if (ticketConfig == null) {
                    this.message.channel.send("On dirait que vous n'avez pas encore configuré les tickets sur ce serveur, vous pouvez le faire en définissant la catégorie via : "+config.command_prefix+this.commandName+" set idDeLaCategorie")
                } else {
                    category = this.message.guild.channels.cache.get(<string>ticketConfig.categoryId);
                    if (category == undefined) {
                        this.message.channel.send("On dirait que la catégorie que vous aviez définie n'existe plus, vous pouvez la redéfinir avec : " + config.command_prefix + this.commandName + " set idDeLaCategorie");
                    } else {
                        this.message.channel.send("Catégorie utilisée pour les tickers : " + category.name);
                    }
                }
                return true;
            case "disable":
                ticketConfig = await TicketConfig.findOne({serverId: this.message.guild.id, categoryId: { $ne: null }});
                if (ticketConfig == null) {
                    this.message.channel.send("On dirait que vous n'avez pas encore configuré les tickets sur ce serveur, vous pouvez le faire en définissant la catégorie via : "+config.command_prefix+this.commandName+" set idDeLaCategorie")
                } else {
                    ticketConfig.enabled = false; // @ts-ignore
                    ticketConfig.save();
                    this.message.channel.send("La fonctionalité des tickets a été désactivée.");
                }
                return true;
            case "enable":
                ticketConfig = await TicketConfig.findOne({serverId: this.message.guild.id, categoryId: { $ne: null }});
                if (ticketConfig == null) {
                    this.message.channel.send("On dirait que vous n'avez pas encore configuré les tickets sur ce serveur, vous pouvez le faire en définissant la catégorie via : "+config.command_prefix+this.commandName+" set idDeLaCategorie")
                } else {
                    ticketConfig.enabled = true; // @ts-ignore
                    ticketConfig.save();
                    this.message.channel.send("La fonctionalité des tickets a été activée. \nFaite '"+config.command_prefix+this.commandName+" show ' pour voir le nom de la catégorie dans laquelle apparaitrons les tickets");
                }
                return true;
            case "blacklist":
                if (typeof(args[1]) == "undefined") {
                    this.sendErrors({
                        name: "Argument missing",
                        value: "Please specify 'add' or 'remove'"
                    });
                    return false;
                }
                let userId;
                switch(args[1]) {
                    case "add":
                        if (typeof(args[2]) == "undefined") {
                            this.sendErrors({
                                name: "Argument missing",
                                value: "You need to specify the user to add"
                            });
                            return false;
                        }
                        userId = extractUserId(args[2]);
                        if (!userId) {
                            this.sendErrors({
                                name: "Bad argument",
                                value: "You haven't correctly mentionned the user to add"
                            });
                            return false;
                        }
                        return this.addUserToBlackList(this.message.guild.id,userId);

                    case "remove":
                        if (typeof(args[2]) == "undefined") {
                            this.sendErrors({
                                name: "Argument missing",
                                value: "You need to specify the user to remove"
                            });
                            return false;
                        }
                        userId = extractUserId(args[2]);
                        if (!userId) {
                            this.sendErrors({
                                name: "Bad argument",
                                value: "You haven't correctly mentionned the user to remove"
                            });
                            return false;
                        }
                        return this.removeUserFromBlackList(this.message.guild.id,userId);

                    case "show":
                        return this.showUsersInBlackList(bot, this.message.guild.id);
                }
                this.sendErrors({
                    name: "Bad argument",
                    value: "Please specify 'add', 'remove' or 'show'"
                })
                return false;
        }

        this.sendErrors({
            name: "Bad argument",
            value: "Please specify 'set', 'show', 'enable', 'disable' or 'help'"
        })
        return false;
    }

    async addUserToBlackList(serverId, userId) {
        let ticketConfig: ITicketConfig = await TicketConfig.findOne({serverId: serverId});
        if (ticketConfig == null) {
            ticketConfig = {
                enabled: false,
                categoryId: null,
                blacklist: [userId],
                serverId: serverId
            }
            TicketConfig.create(ticketConfig);
        } else {
            if (ticketConfig.blacklist.includes(userId)) {
                this.message.channel.send("Il semblerait que cet utilisateur se trouve déjà dans la blacklist");
                return true;
            }

            ticketConfig.blacklist.push(userId);// @ts-ignore
            ticketConfig.save();
        }
        this.message.channel.send("L'utilisateur a été ajouté avec succès à la blacklist !");
        return true;
    }

    async removeUserFromBlackList(serverId, userId) {
        let ticketConfig: ITicketConfig = await TicketConfig.findOne({serverId: serverId});

        if (ticketConfig == null || !ticketConfig.blacklist.includes(userId)) {
            this.message.channel.send("Il semblerait que l'utilisateur ne se trouve pas dans la blacklist");
            return true;
        }
        let list = ticketConfig.blacklist ;
        for (let i=0;i<list.length;i++) {
            if (list[i] == userId) {
                list.splice(i,1);
                break;
            }
        } // @ts-ignore
        ticketConfig.save();

        this.message.channel.send("L'utilisateur a été retiré avec succès de la blacklist !");
        return true;
    }

    async showUsersInBlackList(bot, serverId) {
        let ticketConfig: ITicketConfig = await TicketConfig.findOne({serverId: serverId});

        let Embeds = [new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Les utilisateurs de la blacklist :")
            .setDescription("Liste des utilisateurs de la blacklist")
            .setTimestamp()];

        if (ticketConfig == null || ticketConfig.blacklist.length == 0) {
            Embeds[0].addFields({
                name: "Aucun utilisateur",
                value: "Il n'y a aucun utilisateur dans la blacklist"
            });
        } else {
            const list = ticketConfig.blacklist;
            let users: Array<any> = [];

            for (const userId of list) {
                try { // @ts-ignore
                    const user = await this.message.guild.members.fetch(userId);
                    users.push(user.user);
                } catch(e) {
                    users.push({username: "unknown", id: userId});
                }
            }
            users.sort((user1: any, user2: any) => {
                if (user1.username == "unknown") return -1;
                if (user2.username == "unknown") return 1;
                return user1.username.toLowerCase() > user2.username.toLowerCase() ? 1 : -1;
            });

            const linePerMessage = 5;
            const userDisplayedPerLine = 10;

            for  (let msg=0; msg*linePerMessage*userDisplayedPerLine < users.length; msg ++) {
                if (msg > 0) {
                    Embeds.push(new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle("Les utilisateurs de la blacklist (Partie "+(msg+1)+") :")
                        .setDescription("Liste des utilisateurs de la blacklist")
                        .setTimestamp());
                }
                let Embed = Embeds[Embeds.length-1];
                for (let line = 0; line < linePerMessage && msg*linePerMessage*userDisplayedPerLine + line*userDisplayedPerLine < users.length; line++) {
                    let usersNames: Array<string> = [];
                    for (let userIndex=0;userIndex < userDisplayedPerLine && msg*linePerMessage*userDisplayedPerLine + line*userDisplayedPerLine + userIndex < users.length;userIndex++) {
                        const user = users[msg*linePerMessage*userDisplayedPerLine + line*userDisplayedPerLine + userIndex];
                        usersNames.push("@"+(user != null ? user.username : "unknown")+"("+user.id+")");
                    }
                    Embed.addFields({
                        name: "Les utilisateurs :",
                        value: usersNames.join(", ")
                    });
                }
            }
        }
        for (let Embed of Embeds) {
            this.message.channel.send(Embed);
        }
        return true;
    }

    help(Embed) {
        Embed.addFields({
            name: "Arguments :",
            value: "set, définir l'id de la catégorie dans laquelle apparaitrons les tickets\n"+
                   "show, pour voir la catégorie qui a été définie\n"+
                   "enable, pour activer les tickets sur ce serveur\n"+
                   "disable, pour désactiver les tickets sur ce serveur\n"+
                   "blacklist add, pour ajouter un utilisateur à la blacklist\n"+
                   "blacklist remove, pour retirer un utilisateur de la blacklist\n"+
                   "blacklist show, pour visionner les utilisateurs de la blacklist"
        }).addFields({
            name: "Exemples :",
            value: config.command_prefix+this.commandName+" set 475435899654125637\n"+
                   config.command_prefix+this.commandName+" show\n"+
                   config.command_prefix+this.commandName+" enable\n"+
                   config.command_prefix+this.commandName+" disable\n"+
                   config.command_prefix+this.commandName+" blacklist add @unUtilisateur\n"+
                   config.command_prefix+this.commandName+" blacklist remove @unUtilisateur\n"+
                   config.command_prefix+this.commandName+" blacklist show"
        })
    }
}
