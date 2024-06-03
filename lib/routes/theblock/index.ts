import { Route } from '@/types';
import cache from '@/utils/cache';
import { load } from 'cheerio';
import puppeteer from '@/utils/puppeteer';
import logger from '@/utils/logger';
import moment from 'moment';

const baseUrl = 'https://www.theblock.co';

const dateFormats = ['MMM DD, YYYY, HH:mmA ZZ', 'MMMM DD, YYYY, HH:mmA ZZ'];

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/theblock',
    name: 'The Block',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const browser = await puppeteer();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        request.resourceType() === 'document' ? request.continue() : request.abort();
    });
    const link = `${baseUrl}/latest`;
    logger.http(`Requesting ${link}`);
    await page.goto(link, {
        waitUntil: 'domcontentloaded',
    });
    const response = await page.content();
    page.close();

    const $ = load(response);

    const list = $('.articles article')
        .toArray()
        .map((item) => {
            item = $(item);
            const a = item.find('a').first();
            return {
                title: item.find('h2').first().text(),
                link: `${baseUrl}${a.attr('href')}`,
                pubDate: moment(item.find('.pubDate').text().trim(), dateFormats),
                category: item
                    .find('.category a')
                    .toArray()
                    .map((item) => $(item).text()),
            };
        });

    const items = await Promise.all(
        list.map((item) =>
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

                $('.copyright').remove();
                const quickTakes = $('div.quickTake li');
                // covert to format:
                // Quick Take:
                // - item 1
                // - item 2
                // ...
                let description = '';
                if (quickTakes.length > 0) {
                    description += 'Quick Take:\n';
                    quickTakes.each((_, el) => {
                        description += `- ${$(el).text()}\n`;
                    });
                }

                const p = $('article.articleBody p')
                    .toArray()
                    .map((item) => $(item).text())
                    .join('\n');

                item.description = `${description}\n${p}`;

                return item;
            })
        )
    );

    browser.close();
    return {
        title: 'The Block',
        link: 'https://theblock.co',
        item: items,
        language: 'en-us',
    };
}
