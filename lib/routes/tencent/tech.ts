import { Route } from '@/types';
import { load } from 'cheerio';
import { parseRelativeDate } from '@/utils/parse-date';
import puppeteer from '@/utils/puppeteer';
import logger from '@/utils/logger';

const baseUrl = 'https://news.qq.com/ch/tech';

export const route: Route = {
    path: '/tech',
    categories: ['other'],
    example: '/tencent/tech',
    name: 'tencent tech',
    maintainers: ['Daring Cλlf'],
    handler,
    url: baseUrl,
};

async function handler() {
    const browser = await puppeteer();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        request.resourceType() === 'document' ? request.continue() : request.abort();
    });
    const link = baseUrl;
    logger.http(`Requesting ${link}`);
    await page.goto(link, {
        waitUntil: 'domcontentloaded',
    });
    const response = await page.content();
    page.close();

    const $ = load(response);

    const list = $('div.channel-feed-list div.channel-feed-item')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const $a = $item.find('a.article-title').first();
            return {
                title: $a.text(),
                link: $a.attr('href'),
                pubDate: parseRelativeDate($item.find('div.article-media span.time').text().trim()),
            };
        });

    return {
        title: 'tencent tech',
        link: baseUrl,
        item: list,
    };
}
