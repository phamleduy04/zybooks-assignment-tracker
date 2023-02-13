import dayjs from 'dayjs';
import { yellow, red, green } from 'colorette';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const timeNow = () => `[${dayjs().tz(process.env.TIME_ZONE || 'America/Chicago').format("MM-DD-YYYY hh:mm:ss")}]`;

const msg = (func: Function, message: string) => func(yellow(`${timeNow()} ${green(message)}`));

const err = (message: any = 'Unkown Err!') => console.error(`${yellow(timeNow())} ${red(message)}`);

const info = (message: string) => msg(console.info, message);
const warn = (message: string) => msg(console.warn, `${yellow('WARNING ->')} -> ${message}`);

export {
    err,
    info,
    warn
};