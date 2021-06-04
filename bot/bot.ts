import config from "./config";
import Command from "./Classes/Command";
import { CommandInfo, CommandsDescriptionHelper } from "./Classes/CommandsDescription";
import WelcomeMessage, { IWelcomeMessage } from "./Models/WelcomeMessage";
import * as Discord from "discord.js";
import init from "./init";
import { readdir } from "fs";



const bot = new Discord.Client();
export const commands = new Array<Command>();
export const commandInfos = CommandsDescriptionHelper.generateCommandInfos(commands);


readdir('./Commands/', (err, allFiles) => {
    if (err) { 
        console.log(err);
    }

    let files = allFiles.filter(f => f.split('.').pop() === 'js');

    if (files.length <= 0) {
        console.log('No commands found!');
    }
    else for(let file of files) {
        commands.push(require(`./commands/${file}`) as Command);
    }
});

// check all commands
bot.on('message', async message => {
    //console.log(message.content)
    for (let commandName in commandInfos) {
        const commandClass = commandInfos[commandName].commandClass;
        const command = new commandClass(message);
        command.check(bot);
    }

    if (!message.author.bot) {

        if (message.type == "GUILD_MEMBER_JOIN") { // @ts-ignore
            const welcomeMessage: IWelcomeMessage = await WelcomeMessage.findOne({serverId: message.guild.id, enabled: true});
            if (welcomeMessage != null) {
                try {
                    await message.author.send(welcomeMessage.message);
                } catch (e) {
                    if (e.message == "Cannot send messages to this user") {
                        message.channel.send("<@"+message.author.id+"> \n\n"+welcomeMessage.message);
                    }
                }
            }
        }
    }
});

bot.login(config.token);

init(bot);


// @ts-ignore
String.prototype.replaceAll = function (A,B) {
    let str = this.valueOf();
    while (str.replace(A,B) != str) {
        str = str.replace(A,B);
    }
    return str;
}
