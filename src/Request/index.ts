import 'dotenv/config';
import { Pool } from 'undici';
const requestPool = new Pool('https://zyserver.zybooks.com');
import { err, info } from '../Log';
import type { ZybookAuth, Assignment } from '../Interfaces';
import dayjs from 'dayjs';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault(process.env.TIMEZONE || 'America/Chicago');

const getAuthToken = async (): Promise<ZybookAuth> => {
    info('Getting auth token from Zybooks....');
    const response = await requestPool.request({
        path: '/v1/signin',
        method: 'POST',
        body: JSON.stringify({
            email: process.env.EMAIL,
            password: process.env.PASSWORD,
        }),
    });

    if (response.statusCode == 200) info('Got auth token from Zybooks!');
    else {
        err('Failed to get auth token from Zybooks!');
        err(`Status code: ${response.statusCode}`);
    }

    const body = await response.body.json();
    if (!body.success) err('Failed to get auth token');
    return {
        authToken: body.session.auth_token,
        refreshToken: body.session.refresh_token,
        expiryDate: dayjs(body.session.expiry_date),
    };
};

const refreshToken = async (auth_token: string, refresh_token: string): Promise<ZybookAuth> => {
    const response = await requestPool.request({
        path: '/v1/refresh',
        method: 'POST',
        body: JSON.stringify({
            refresh_token,
            auth_token,
        }),
    });

    const body = await response.body.json();
    if (!body.success) err('Failed to refresh token');
    return {
        authToken: body.session.auth_token,
        refreshToken: body.session.refresh_token,
        expiryDate: dayjs.tz(body.session.expiry_date),
    };
};

const getAsignments = async (authToken: string): Promise<Assignment[]> => {
    const response = await requestPool.request({
        path: `/v1/zybook/${process.env.CLASSCODE}/assignments?auth_token=${authToken}`,
        method: 'GET',
    });

    const body = await response.body.json();
    return body.assignments.map((assignment: any) => {
        return {
            title: assignment.title,
            dueDate: dayjs(assignment.due_dates[0].date).unix(),
            subTitle: assignment.sections.map((section: any) => section.title),
        };
    });
};

export { getAuthToken, refreshToken, getAsignments };
