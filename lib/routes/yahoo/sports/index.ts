import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';

const baseUrl = 'https://sports.yahoo.com';

export const route: Route = {
    path: '/sports',
    categories: ['other'],
    example: '/yahoo/sports',
    name: 'yahoo sports',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(`${baseUrl}/rss`);

    const items = await Promise.all(
        feed.items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                item.description = $('.caas-body')
                    .first()
                    .find('p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n')
                    .trim();

                return item;
            })
        )
    );

    return {
        title: 'Yahoo! Sports',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
