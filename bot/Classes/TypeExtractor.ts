import {GuildChannel, GuildEmoji, Message} from "discord.js";
import client from "../client";

export const extractTypes = {
    channel: (field, message: Message): GuildChannel|boolean => {
        if (message.guild == null) return false;
        let channelId = field.split("<#")[1];
        channelId = channelId.substring(0,channelId.length-1);
        const channel = message.guild.channels.cache.get(channelId);
        return channel != undefined ? channel : false;
    },
    message: async (field, _: Message, channel: GuildChannel|boolean): Promise<Message|boolean> => {
        if (channel) {
            try { // @ts-ignore
                return await channel.messages.fetch(field)
            } catch (e) {
                return false;
            }
        }
        return false;
    },
    listenerReactMessage: async (field, message: Message): Promise<{channel: GuildChannel, message: Message}|boolean> => {
        const channelMention = field.split("/")[0];
        const channel: GuildChannel|boolean|undefined = extractTypes.channel(channelMention, message);
        let messageToGet: Message|null = null
        if (channel instanceof GuildChannel) {
            const messageId = field.split("/")[1].replaceAll(" ","");
            // @ts-ignore
            messageToGet = await extractTypes.message(messageId,message,channel);
        } else {
            return false;
        }
        return messageToGet ? {message: messageToGet,channel} : false;
    },
    emote: (field, _: Message): GuildEmoji|boolean => {
        const emoteId = field.split(":")[2].split(">")[0];
        const emote = client.emojis.cache.get(emoteId);
        return emote ? emote : false;
    }
}
;