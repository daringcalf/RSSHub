import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import { load } from 'cheerio';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';

const baseUrl = 'https://www.coindesk.com';
const feedUrl = `${baseUrl}/feed`;

export const route: Route = {
    path: '/',
    categories: ['new-media'],
    example: '/coindesk',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'coindesk',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(feedUrl);

    const items = await Promise.all(
        feed.items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                item.description = $('.main-body-grid p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n')
                    .trim();

                return item;
            })
        )
    );

    return {
        title: 'CoinDesk',
        link: baseUrl,
        item: items,
    };
}
