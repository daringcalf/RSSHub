import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';

const baseUrl = 'https://www.cbsnews.com';
const rssUrl = `${baseUrl}/latest/rss/main`;

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/cbsnews',
    name: 'cbsnews',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(rssUrl);

    const items = await Promise.all(
        feed.items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                item.description = $('.content__body')
                    .first()
                    .find('p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n')
                    .trim();

                return item;
            })
        )
    ).then((items) => items.filter((item) => item.description));

    return {
        title: 'CBSNews',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
