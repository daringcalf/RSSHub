import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import { load } from 'cheerio';

const baseUrl = 'https://www.theverge.com';
const feedUrl = `${baseUrl}/rss/front-page/index.xml`;

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/theverge',
    name: 'theverge',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(feedUrl);

    const items = feed.items.map((item) => {
        const $ = load(item.content);
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
        title: 'theverge',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
