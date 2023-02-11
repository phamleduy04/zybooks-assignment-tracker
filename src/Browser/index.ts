import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import RandomUserAgent from 'puppeteer-extra-plugin-anonymize-ua';
import { executablePath, Browser, Page } from 'puppeteer';
import 'dotenv/config';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const { URL, EMAIL, PASSWORD, TIMEZONE, HEADLESS, EXECUTABLE_PATH } = process.env;

dayjs.tz.setDefault(TIMEZONE || 'America/Chicago');

puppeteer.use(StealthPlugin());
puppeteer.use(RandomUserAgent());

interface Assignment {
    title: string,
    due: number
}

const getAssignmentData = async (page: Page) => {
    const assignments: Assignment[]  = [];
    await page.waitForSelector('.assignment-title');

    const $ = cheerio.load(await page.content());
    $('.assignment-summary').each((i, el) => {
        const assignment = cheerio.load(el);

        const title = assignment('.assignment-title').text().trim();
        const due = dayjs(assignment('.due-date-text').text().trim().split('Due: ')[1]).unix();

        assignments.push({ title, due });
    });
    return assignments;
}

const launch = async () => {
    const browser: Browser = await puppeteer.launch({
        headless: HEADLESS == 'true' || false,
        slowMo: 10,
        userDataDir: 'cache',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: EXECUTABLE_PATH || executablePath(),
    });

    const page: Page = await browser.newPage();
    await page.goto(URL || 'https://learn.zybooks.com/signin', {
        waitUntil: 'domcontentloaded',
    });

    if (page.url() == "https://learn.zybooks.com/signin") {
        try {
            await page.type('#ember8', EMAIL || '');
            await page.type('#ember10', PASSWORD || '');
            await page.click('.flex-1 > button');
        }
        catch(e) {
            console.error(e);
        }
    }

    return page;
};

export { launch, getAssignmentData, Assignment };