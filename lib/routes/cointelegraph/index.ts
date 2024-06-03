import { Route } from '@/types';
import { load } from 'cheerio';
import logger from '@/utils/logger';
import puppeteer from '@/utils/puppeteer';
import cache from '@/utils/cache';
import parser from '@/utils/rss-parser';

const baseUrl = 'https://cointelegraph.com';
const rssUrl = 'https://cointelegraph.com/rss';

export const route: Route = {
    name: 'Cointelegraph',
    path: '/',
    categories: ['finance'],
    example: '/cointelegraph',
    maintainers: ['Daring Cλlf'],
    handler: async () => {
        const feed = await parser.parseURL(rssUrl);

        const browser = await puppeteer();

        const items = await Promise.all(
            feed.items.map((item) =>
                cache.tryGet(item.link, async () => {
                    const page = await browser.newPage();
                    await page.setRequestInterception(true);
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

                    const paragraphs = $('.post-content p');

                    const description = paragraphs
                        .map((_, el) => $(el).html())
                        .get()
                        .join(' ');

                    return {
                        title: item.title,
                        pubDate: item.pubDate,
                        link: item.link,
                        category: item.categories,
                        description,
                    };
                })
            )
        );

        browser.close();

        return {
            title: 'Cointelegraph',
            link: baseUrl,
            description: 'Cointelegraph: Bitcoin, Ethereum, Crypto News & Price Indexes',
            item: items,
        };
    },
};
