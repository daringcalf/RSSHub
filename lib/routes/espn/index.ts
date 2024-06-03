import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';

const baseUrl = 'https://www.espn.com';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/espn',
    name: 'espn',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(`${baseUrl}/espn/rss/news`);

    const items = await Promise.all(
        feed.items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                item.description = $('.article-body p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n')
                    .trim();

                return item;
            })
        )
    );

    return {
        title: 'ESPN',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
