import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import { load } from 'cheerio';
import ofetch from '@/utils/ofetch';
import cache from '@/utils/cache';

const baseUrl = 'https://www.investing.com';
const feedUrl = `${baseUrl}/rss/news.rss`;

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/investing',
    name: 'investing',
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

                item.description = $('div.article_container[id="article"] p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n')
                    .trim();

                return item;
            })
        )
    );

    return {
        title: 'investing',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
