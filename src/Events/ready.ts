import { Event } from '../Interfaces';
import Client from '../Client';

export const event: Event = {
    name: 'ready',
    run: async (client: Client) => {
        console.log(`Bot ${client.user?.tag} is ready!`);
    }
}