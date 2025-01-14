import { Schema } from 'mongoose';
import { connect } from "../../Mongo";


const db = connect();

export interface IVocalConfig {
    enabled: boolean;
    listenerBlacklist: { roles: string[], users: string[] };
    channelBlacklist: string[];
    serverId: string;
}

const ListenerBlacklistSchema: Schema = new Schema({
    roles: { type: Array, required: true },
    users: { type: Array, required: true }
});

const VocalConfigSchema: Schema = new Schema({
    enabled: { type: Boolean, required: true },
    listenerBlacklist: { type: ListenerBlacklistSchema, required: true },
    channelBlacklist: { type: Array, required: true },
    serverId: { type: String, required: true }
});

// @ts-ignore
export default db.model<IVocalConfig>('VocalConfig', VocalConfigSchema);
