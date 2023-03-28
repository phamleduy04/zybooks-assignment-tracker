import { Event } from '../Interfaces';
import Client from '../Client';
import { EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import _ from 'lodash';
import * as log from '../Log';
import db from '../Database';
import { getAsignments } from '../Request';

import type { Assignment } from '../Interfaces';

export const event: Event = {
    name: 'ready',
    run: async (client: Client) => {
        log.info(`Bot ${client.user?.tag} is ready!`);
        await fetchAssignments(client);
    },
};

async function fetchAssignments(client: Client) {
    log.info('Fetching assignments...');
    const AssignmentCache = (await db.get('zybooks')) || [];
    const assignments = await getAsignments(client.zybookAuth.authToken);
    if (assignments.length != 0 && !_.isEqual(assignments, AssignmentCache)) await sendAssignments(client, assignments);
    await db.set('zybooks', assignments);
    setTimeout(async () => await fetchAssignments(client), 1000 * 60 * 10);
}

async function sendAssignments(client: Client, assignment: Assignment[]) {
    const channel = await client.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID || '');
    if (!channel || channel.type !== ChannelType.GuildText) return log.err('Channel not found or not GuildText!');
    const messages = await channel.messages.fetch();
    await channel.bulkDelete(messages).catch(() => null);
    const button = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(process.env.CLASSCODE ? `https://learn.zybooks.com/zybook/${process.env.CLASSCODE}` : 'https://learn.zybooks.com')
        .setLabel('Go to ZyBooks');
    await channel.send({ embeds: getMultipleEmbeds(assignment), components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)], content: 'New ZyBooks Assignments!' });
}

function getMultipleEmbeds(assignment: Assignment[]) {
    const embeds = [];
    for (let i = 0; i < assignment.length; i++) {
        const embed = new EmbedBuilder().setTitle('ZyBooks Assignments');
        embed.addFields([
            { name: 'Assignment name', value: assignment[i].title },
            { name: 'Due date', value: `<t:${assignment[i].dueDate}:R>` },
            { name: 'Details', value: assignment[i].subTitle.join('\n') },
        ]);
        embeds.push(embed);
    }

    return embeds;
}
