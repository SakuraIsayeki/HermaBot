import config from "../config";
import Command from "../Classes/Command";
import WelcomeMessage, {IWelcomeMessage} from "../Models/WelcomeMessage";
import {
    CommandInteractionOptionResolver,
    Guild,
    GuildMember,
    Message,
    MessageEmbed,
    TextBasedChannels,
    User
} from "discord.js";

export default class ConfigWelcome extends Command {
    static display = true;
    static description = "Pour activer, désactiver, ou définir le message privé à envoyer aux nouveaux arrivants."
    static commandName = "configWelcome";

    static slashCommand = true;

    static argsModel = {

        $argsByOrder: [
            {
                isSubCommand: true,
                field: "action",
                type: "string",
                required: true,
                description: "L'action à effectuer: set, show, disable ou enable",
                choices: {
                    set: "Définir le message de bienvenue",
                    show: "Afficher le message de bienvenue configuré",
                    disable: "Désactiver le message de bienvenue",
                    enable: "Activer le message de bienvenue"
                }
            }
        ]
    }

    constructor(channel: TextBasedChannels, member: User|GuildMember, guild: null|Guild = null, writtenCommandOrSlashCommandOptions: null|string|CommandInteractionOptionResolver = null, commandOrigin: string) {
        super(channel, member, guild, writtenCommandOrSlashCommandOptions, commandOrigin, ConfigWelcome.commandName, ConfigWelcome.argsModel);
    }

    async action(args: {action: string}, bot) {
        const {action} = args;

        if (this.guild == null)
            return this.response(false,
                this.sendErrors( {
                    name: "Missing guild",
                    value: "We couldn't find the guild"
                })
            );

        let resultContent: string;
        let welcomeMessage: IWelcomeMessage;
        switch(action) {
            case "set":
                return this.response(true, "Veuillez rentrer le message, qui sera envoyé en MP aux nouveaux arrivants sur ce serveur :",
                    () => new Promise(resolve =>  {
                        const listener = async (response: Message) => {
                            if (response.author.id == this.member.id) { // @ts-ignore
                                let welcomeMessage: IWelcomeMessage = await WelcomeMessage.findOne({serverId: this.guild.id});
                                let create = false;
                                if (welcomeMessage == null) {
                                    create = true;
                                    welcomeMessage = {
                                        enabled: true,
                                        message: response.content, // @ts-ignore
                                        serverId: this.guild.id
                                    };
                                    WelcomeMessage.create(welcomeMessage);
                                } else {
                                    welcomeMessage.message = response.content; // @ts-ignore
                                    welcomeMessage.save();
                                }
                                bot.off('messageCreate', listener);

                                if (this.commandOrigin === 'slash')
                                    response.delete();

                                resolve(
                                    this.response(true,
                                    "Votre message a été enregistré et sera envoyé en MP aux nouveaux arrivants de ce serveur"+
                                    (create ?  "\n(L'envoie de MP aux nouveaux a été activé)" : ""))
                                );
                            }
                        };
                        bot.on('messageCreate', listener);
                    }));
            case "show":
                welcomeMessage = await WelcomeMessage.findOne({serverId: this.guild.id});
                if (welcomeMessage == null) {
                    resultContent = "Il n'y a pas de message définit, vous pouvez le définir avec : "+config.command_prefix+this.commandName+" set";
                } else {
                    resultContent = "Message définit : \n\n---------------------------------\n\n"+welcomeMessage.message;
                }
                return this.response(true, resultContent);
            case "disable":
                welcomeMessage = await WelcomeMessage.findOne({serverId: this.guild.id});
                if (welcomeMessage == null) {
                    resultContent = "Il n'y a pas de message définit, vous pouvez le définir avec : "+config.command_prefix+this.commandName+" set";
                } else {
                    welcomeMessage.enabled = false; // @ts-ignore
                    welcomeMessage.save();
                    resultContent = "L'envoie de MP aux nouveaux a été désactivé.";
                }
                return this.response(true, resultContent);
            case "enable":
                welcomeMessage = await WelcomeMessage.findOne({serverId: this.guild.id});
                if (welcomeMessage == null) {
                    resultContent = "Il n'y a pas de message définit, vous pouvez le définir avec : "+config.command_prefix+this.commandName+" set";
                } else {
                    welcomeMessage.enabled = true; // @ts-ignore
                    welcomeMessage.save();
                    resultContent = "L'envoie de MP aux nouveaux a été activé, faite '"+config.command_prefix+this.commandName+" show' pour voir le MP qui sera envoyé aux nouveaux";
                }
                return this.response(true, resultContent);
        }
        return this.response(false, "Aucun action mentionnée");
    }

    help() {
        return new MessageEmbed()
            .setTitle("Exemples :")
            .addFields([
                {
                    name: "disable",
                    value: "Désactiver le message de bienvenue"
                },
                {
                    name: "enable",
                    value: "Activer le message de bienvenue"
                },
                {
                    name: "set",
                    value: "Définir le message de bienvenue qui sera envoyé en MP au nouveaux arrivant."
                },
                {
                    name: "show",
                    value: "Afficher le message bienvenue"
                },
                {
                    name: "-h",
                    value: "Afficher l'aide"
                }
            ].map(field => ({
                name: config.command_prefix+this.commandName+" "+field.name,
                value: field.value
            })));
    }
}
