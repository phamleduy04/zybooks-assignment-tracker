import { Client, Collection, Partials } from 'discord.js';
import 'dotenv/config';
import type { Command, Event, Slash, ZybookAuth } from '../Interfaces';
import path from 'path';
import { readdirSync } from 'fs';
import { getAuthToken, refreshToken } from '../Request';

class Bot extends Client {
    public commands: Collection<string, Command> = new Collection();
    public events: Collection<string, Event> = new Collection();
    public slash: Collection<string, Slash> = new Collection();
    public aliases: Collection<string, string> = new Collection();
    public zybookAuth: ZybookAuth = {};

    public constructor() {
        super({
            intents: 32767,
            partials: [Partials.Channel],
            allowedMentions: { repliedUser: true },
        });
    }

    public async init() {
        this.login(process.env.TOKEN);

        //Event Handler
        const eventPath = path.join(__dirname, '..', 'Events');
        readdirSync(eventPath).forEach(async (file) => {
            const { event } = await import(`${eventPath}/${file}`);
            this.events.set(event.name, event);
            this.on(event.name, event.run.bind(null, this));
        });

        await getAuth();
    }

    public async getAuth(): Promise<void> {
        if (this.zybookAuth.authToken && this.zybookAuth.refreshToken) this.zybookAuth = await refreshToken(this.zybookAuth.authToken, this.zybookAuth.refreshToken);
        this.zybookAuth = await getAuthToken();
        const timeUntil = this.zybookAuth?.expiryDate?.valueOf() - new Date().valueOf() || 10;
        setTimeout(() => this.getAuth(), );
    }
}

async function getAuth() {

}

export default Bot;
