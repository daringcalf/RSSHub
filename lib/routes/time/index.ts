import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import { load } from 'cheerio';

const baseUrl = 'https://time.com';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/time',
    name: 'TIME',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(`${baseUrl}/feed`);

    const items = feed.items.map((item) => {
        const $ = load(item.contentEncoded);
        const description = $('p')
            .toArray()
            .map((el) => $(el).text())
            .join('\n');

        return {
            title: item.title,
            pubDate: item.pubDate,
            link: item.link,
            description,
        };
    });

    return {
        title: 'TIME',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
