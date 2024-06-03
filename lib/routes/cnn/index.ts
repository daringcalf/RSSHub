import { Route } from '@/types';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import moment from 'moment';
import puppeteer from '@/utils/puppeteer';
import logger from '@/utils/logger';

const baseUrl = 'https://www.cnn.com';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/cnn',
    name: 'CNN',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const response = await ofetch(baseUrl);
    const $ = load(response);

    const list = $('a.container__link--type-article:has(span.container__headline-text)')
        .toArray()
        .slice(0, 10)
        .map((item) => {
            const href = $(item).attr('href');
            const link = href.startsWith('http') ? href : baseUrl + href;
            return {
                link,
            };
        });

    const browser = await puppeteer();
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

                item.title = $('h1[data-editable="headlineText"]').first().text();

                item.description = $('div.article__content p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n');

                item.pubDate = parseDateTime($('div.timestamp[data-editable="settings"]').first().text());

                return item;
            })
        )
    );
    // .then((items) => items.filter((item) => item && item.title && item.description && item.pubDate));

    browser.close();
    return {
        title: 'CNN',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}

function getOffsetFromAbbreviation(tzAbbrev) {
    const zones = {
        EDT: '-0400',
        EST: '-0500',
        PDT: '-0700',
        PST: '-0800',
        CST: '-0600',
        UTC: '+0000',
    };
    return zones[tzAbbrev] || '+0000';
}

function parseDateTime(dateTimeStr) {
    const tzMatch = dateTimeStr.match(/\b([A-Z]{2,4})\b/);
    const tzAbbrev = tzMatch ? tzMatch[1] : 'UTC';

    const offset = getOffsetFromAbbreviation(tzAbbrev);

    // Remove non-digit and timezone abbreviation for generic parsing
    const cleanedString = dateTimeStr
        .replace(/^\D+/, '')
        .replace(/\b[A-Z]{2,4}\b/, '')
        .trim();

    const format = `h:mm A [${offset}], ddd MMM DD, YYYY`;

    const dateTime = moment(cleanedString + ' ' + offset, format);

    return dateTime.isValid() ? dateTime.toDate() : null;
}
