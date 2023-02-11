import { Event } from '../Interfaces';
import Client from '../Client';
import * as broswer from '../Browser';
import { EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import dayjs from 'dayjs';
import _ from 'lodash';
import type { Assignment } from '../Browser';
import type { Page } from 'puppeteer';


let AssignmentCache: Assignment[] = [];

export const event: Event = {
    name: 'ready',
    run: async (client: Client) => {
        console.log(`Bot ${client.user?.tag} is ready!`);
        console.log('Launching browser...');
        const page = await broswer.launch();
        console.log('Browser launched!');
        await fetchAssignments(client, page);
    }
}

async function fetchAssignments(client: Client, page: Page) {
    const assignments = (await broswer.getAssignmentData(page)).filter(assignment => assignment.due > dayjs().unix());
    if (!_.isEmpty(_.xor(assignments, AssignmentCache))) await sendAssignments(client, assignments);
    AssignmentCache = assignments;
    setInterval(() => fetchAssignments(client, page), 1000 * 60 * 10);
}

async function sendAssignments(client: Client, assignment: Assignment[]) {
    const channel = await client.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID || '');
    if (!channel || channel.type !== ChannelType.GuildText) return console.error('Channel not found or not GuildText!');
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
        embed.addFields([ { name: 'Assignment name', value: assignment[i].title }, { name: 'Due date', value: `<t:${assignment[i].due}:R>` }])
        embeds.push(embed);
    }
    
    return embeds;
}