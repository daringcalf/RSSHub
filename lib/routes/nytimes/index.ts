import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import cache from '@/utils/cache';
import { load } from 'cheerio';
import puppeteer from '@/utils/puppeteer';
import logger from '@/utils/logger';

const baseUrl = 'https://www.nytimes.com/';
const feedUrl = 'https://content.api.nytimes.com/svc/news/v3/all/recent.rss';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/nytimes',
    name: 'nytimes',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(feedUrl);

    const browser = await puppeteer();
    const items = await Promise.all(
        feed.items.map((item) =>
            cache.tryGet(item.link, async () => {
                const page = await browser.newPage();
                await page.setRequestInterception(true);
                await page.setJavaScriptEnabled(true);
                page.on('request', (request) => {
                    request.resourceType() === 'document' ? request.continue() : request.abort();
                });

                logger.http(`Requesting ${item.link}`);
                await page.goto(item.link, {
                    waitUntil: 'domcontentloaded',
                });
                const response = await page.content();
                page.close();

                const $ = load(response);

                item.description = $.html();

                return item;
            })
        )
    );

    browser.close();
    return {
        title: 'New York Times',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
