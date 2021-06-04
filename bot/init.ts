import { NotifyOnReact } from "./Commands/NotifyOnReact"
import { Client } from "discord.js";

export default function init(bot: Client) {
    setTimeout(async () => {
        console.log("Detect stored notifyOnReacts in the database and apply them")
        NotifyOnReact.applyNotifyOnReactAtStarting(bot);
    }, 5000);
}
