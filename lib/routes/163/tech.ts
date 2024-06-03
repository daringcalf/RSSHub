import { Route } from '@/types';
import { load } from 'cheerio';
import { parseRelativeDate } from '@/utils/parse-date';
import puppeteer from '@/utils/puppeteer';
import logger from '@/utils/logger';

const baseUrl = 'https://tech.163.com';

export const route: Route = {
    path: '/tech',
    categories: ['other'],
    example: '/163/tech',
    name: '163 tech',
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

    const items = $('div.ndi_main div.news_article')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const $a = $item.find('h3 a').first();
            const pubDate = parseRelativeDate($item.find('span.time').text().trim());
            return {
                title: $a.text(),
                link: $a.attr('href'),
                pubDate,
            };
        });

    return {
        title: '163 tech',
        link: baseUrl,
        item: items,
    };
}
