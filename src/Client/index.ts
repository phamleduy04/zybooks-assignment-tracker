import { Client, Collection, Partials } from 'discord.js';
import 'dotenv/config';
import type { Command, Event, Slash, ZybookAuth } from '../Interfaces';
import path from 'path';
import { readdirSync } from 'fs';
import { getAuthToken, refreshToken, getAsignments } from '../Request';
import dayjs from 'dayjs';
import fs from 'fs';

class Bot extends Client {
    public commands: Collection<string, Command> = new Collection();
    public events: Collection<string, Event> = new Collection();
    public slash: Collection<string, Slash> = new Collection();
    public aliases: Collection<string, string> = new Collection();
    public zybookAuth: ZybookAuth = {
        authToken: '',
        refreshToken: '',
        expiryDate: dayjs(),
    };

    public constructor() {
        super({
            intents: 32767,
            partials: [Partials.Channel],
            allowedMentions: { repliedUser: true },
        });
    }

    public async init() {
        await this.getAuth();
        await this.login(process.env.TOKEN);

        // Event Handler
        const eventPath = path.join(__dirname, '..', 'Events');
        readdirSync(eventPath).forEach(async (file) => {
            const { event } = await import(`${eventPath}/${file}`);
            this.events.set(event.name, event);
            this.on(event.name, event.run.bind(null, this));
        });
        const assignments = await getAsignments(this.zybookAuth.authToken);
        fs.writeFileSync('assignments.json', JSON.stringify(assignments, null, 4));
    }

    public async getAuth(): Promise<void> {
        if (this.zybookAuth.authToken && this.zybookAuth.refreshToken) this.zybookAuth = await refreshToken(this.zybookAuth.authToken, this.zybookAuth.refreshToken);
        this.zybookAuth = await getAuthToken();
        const timeUntil = (this.zybookAuth.expiryDate?.unix() - dayjs().unix()) * 1000 || 10 * 60 * 1000;
        console.log(`Next auth refresh in ${timeUntil / 1000} seconds`);
        setTimeout(() => this.getAuth(), timeUntil);
    }
}

export default Bot;
