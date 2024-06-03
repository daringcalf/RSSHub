import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';

const baseUrl = 'https://decrypt.co';
const feedUrl = `${baseUrl}/feed`;

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/decrypt',
    name: 'decrypt',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(feedUrl);

    feed.items = feed.items.filter((item) => !item.link?.includes('%09'));

    const items = await Promise.all(
        feed.items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                item.description = $('.post-content p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n')
                    .trim();

                return item;
            })
        )
    );

    return {
        title: 'Decrypt',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
