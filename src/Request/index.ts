import 'dotenv/config';
import { Pool } from 'undici';
const requestPool = new Pool('https://zyserver.zybooks.com/v1/');
import { err } from '../Log';
import type { ZybookAuth } from '../Interfaces';

const getAuthToken = async (): Promise<ZybookAuth> => {
    const response = await requestPool.request({
        path: '/signin',
        method: 'POST',
        body: JSON.stringify({
            email: process.env.EMAIL,
            password: process.env.PASSWORD,
        }),
    });

    const body = await response.body.json();
    if (!body.success) err('Failed to get auth token');
    return {
        authToken: body.session.auth_token,
        refreshToken: body.session.refresh_token,
        expiryDate: new Date(body.session.expiry_date),
    };
};

const refreshToken = async (auth_token: string, refresh_token: string): Promise<ZybookAuth> => {
    const response = await requestPool.request({
        path: '/refresh',
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
        expiryDate: new Date(body.session.expiry_date),
    };
};

const getAsignments = async (authToken: string) => {
    const response = await requestPool.request({
        path: `/zybook/${process.env.CLASSCODE}/assignments?auth_token=${authToken}`,
        method: 'GET',
    });

    return await response.body.json();
};

export { getAuthToken, refreshToken, getAsignments };
