import config from "../config";
import Command from "../Classes/Command";
import { existingCommands } from "../Classes/CommandsDescription";
import Permissions, { IPermissions } from "../Models/Permissions";
import Discord from "discord.js";
import {getRolesFromList} from "../Classes/OtherFunctions";

interface IPerm {
    0: string; // set or add
    1: string; // command name
    2: string; // role to add or set
}

export class Perm extends Command {
    static commandName = "perm";

    static async action(message, bot) { //%perm set commandName @role
        const args: IPerm = this.parseCommand(message);

        // check if arguments are correctly filled
        if (typeof(args[0]) == "undefined" || (args[0] != "add" && args[0] != "set" && args[0] != "show" && args[0] != "help")) {
            this.sendErrors(message, {
                name: "Incorrect parametter",
                value: "Incorrect parametter, please type 'add', 'set', 'show', or 'help'"
            });
            return false;
        }

        if (args[0] == "help") {
            this.displayHelp(message);
            return false;
        }

        const action = args[0];

        if (typeof(args[1]) == "undefined") {
            this.sendErrors(message, {
                name: "Command name missing",
                value: "The command name is not specified"
            });
            return false;
        }
        if (!Object.keys(existingCommands).includes(args[1]) || !existingCommands[args[1]].display) {
            this.sendErrors(message, {
                name: "Command name doesn't exist",
                value: "The command '"+args[1]+"' doesn't exist"
            });
            return false;
        }

        const commandName = args[1];

        if (action == "show") { // Show the roles which are allowed to execute the specified command
            const permissions = await Permissions.find({command: commandName, serverId: message.guild.id});

            let Embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle("Les permissions pour '"+commandName+"' :")
                .setDescription("Liste des permissions pour '"+commandName+"'")
                .setTimestamp();

            if (permissions.length == 0 || permissions[0].roles.length == 0) {
                Embed.addFields({
                    name: "Aucune permission",
                    value: "Il n'y a aucune permission trouvée pour la commande "+commandName
                })
            } else {
                let roles: Array<string> = [];
                for (let roleId of permissions[0].roles) {
                    let role = message.guild.roles.cache.get(roleId);
                    let roleName: string;
                    if (role == undefined) {
                        roleName = "unknown";
                    } else {
                        roleName = role.name;
                    }
                    roles.push('@'+roleName);
                }
                Embed.addFields({
                    name: "Les roles :",
                    value: roles.join(",")
                });
            }
            message.channel.send(Embed);
            return true;
        }



        if (typeof(args[2]) == "undefined") { // check if the roles to attibute to that command are correctly filled
            this.sendErrors(message, {
                name: "Roles missing",
                value: "The roles are not specified"
            });
            return false;
        }


        // Attribute or add the specified allowed roles to the specified command
        const specifiedRoles = args[2].split(",");
        const rolesResponse: any = getRolesFromList(specifiedRoles, message);
        if (!rolesResponse.success) {
            this.sendErrors(message, rolesResponse.errors);
            return false;
        }
        const { rolesId } = rolesResponse;

        const serverId = message.guild.id;

        const permissions = await Permissions.find({serverId: serverId, command: commandName});

        if (permissions.length == 0) {
            const permission: IPermissions = {
                command: commandName,
                roles: rolesId,
                serverId: serverId
            }
            Permissions.create(permission);
        } else {
            let permission = permissions[0];
            if (action == "add") {
                for (let roleId of rolesId) {
                    if (permission.roles.includes(roleId)) {
                        this.sendErrors(message, {
                            name: "Role already added",
                            value: "That role is already attributed for that command"
                        });
                        return false;
                    }
                }
                permission.roles = [...permission.roles, ...rolesId]
            } else if (action == "set") {
                permission.roles = rolesId;
            }
            await permission.save();
        }
        message.channel.send("Permission added or setted successfully!");
        return true;
    }

    static help(Embed) {
        Embed
            .addFields({
                name: "Arguments :",
                value: "Permier argument : 'add', 'set' ou 'show', pour ajouter une permission à celle déjà présente, les redéfinir avec set, ou les afficher avec 'show'\n"+
                    "Deuxième argument : La commande sur laquelle ajouter ou définir la permission\n"+
                    "Troisième argument : Le ou les rôles autorisés à taper cette commande"
            })
            .addFields({
               name: "Exemples :",
               value: config.command_prefix+"perm add notifyOnReact @Admins\n"+
                    "Ou "+config.command_prefix+"perm set notifyOnReact '@Admins, @Maintainers'\n"+
                    "Ou "+config.command_prefix+"perm show notifyOnReact"
            });
    }
}