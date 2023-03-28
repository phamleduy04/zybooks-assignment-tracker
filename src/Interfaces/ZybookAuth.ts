import { Dayjs } from 'dayjs';

export type ZybookAuth = {
    authToken: string;
    refreshToken: string;
    expiryDate: Dayjs;
};
