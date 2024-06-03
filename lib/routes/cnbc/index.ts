import { Route } from '@/types';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import parser from '@/utils/rss-parser';

const baseUrl = 'https://www.cnbc.com';
const feedUrl = `${baseUrl}/id/100727362/device/rss`;

export const route: Route = {
    path: '/',
    categories: ['traditional-media'],
    example: '/cnbc',
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },

    name: 'cnbc',
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

                item.description = $('.ArticleBody-articleBody p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n')
                    .trim();

                return item;
            })
        )
    );

    return {
        title: 'cnbc',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
