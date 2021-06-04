import config from "../config";
import Command from "./Command";



export type CommandInfo = {
    msg: string,
    commandClass: any,
    display: boolean
}


export class CommandsDescriptionHelper {
    constructor() { }

    public static generateCommandInfos(commands: Command[]) {
        const commandInfos = new Array<CommandInfo>();

        for (const command of commands) {
            if (command.description !== null) {
                commandInfos.push({
                    msg: command.description as string,
                    commandClass: typeof(command),
                    display: command.display
                })
            }
        }

        return commandInfos;
    }
}