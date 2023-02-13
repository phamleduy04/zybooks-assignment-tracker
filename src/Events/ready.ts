import { Event } from '../Interfaces';
import Client from '../Client';
import * as broswer from '../Browser';
import { EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import dayjs from 'dayjs';
import _ from 'lodash';
import * as log from '../Log';
import db from '../Database';

import type { Assignment } from '../Browser';
import type { Page } from 'puppeteer';

export const event: Event = {
    name: 'ready',
    run: async (client: Client) => {
        log.info(`Bot ${client.user?.tag} is ready!`);
        log.info('Launching browser...');
        const page = await broswer.launch();
        log.info('Browser launched!');
        await fetchAssignments(client, page);
    },
};

async function fetchAssignments(client: Client, page: Page) {
    log.info('Fetching assignments...');
    const AssignmentCache = (await db.get('zybooks')) || [];
    const assignments = (await broswer.getAssignmentData(page)).filter((assignment) => assignment.due > dayjs().unix());
    if (!_.isEqual(assignments, AssignmentCache)) await sendAssignments(client, assignments);
    await db.set('zybooks', assignments);
    setInterval(() => fetchAssignments(client, page), 1000 * 60 * 10);
}

async function sendAssignments(client: Client, assignment: Assignment[]) {
    const channel = await client.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID || '');
    if (!channel || channel.type !== ChannelType.GuildText) return log.err('Channel not found or not GuildText!');
    const messages = await channel.messages.fetch();
    await channel.bulkDelete(messages);
    const button = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(process.env.URL || 'https://discord.com')
        .setLabel('Go to ZyBooks');
    await channel.send({ embeds: getMultipleEmbeds(assignment), components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)], content: 'New ZyBooks Assignments!' });
}

function getMultipleEmbeds(assignment: Assignment[]) {
    const embeds = [];
    for (let i = 0; i < assignment.length; i++) {
        const embed = new EmbedBuilder().setTitle('ZyBooks Assignments');
        embed.addFields([
            { name: 'Assignment name', value: assignment[i].title },
            { name: 'Due date', value: `<t:${assignment[i].due}:R>` },
        ]);
        embeds.push(embed);
    }

    return embeds;
}
