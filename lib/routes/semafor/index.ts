import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import { load } from 'cheerio';

const baseUrl = 'https://www.semafor.com';
const feedUrl = `${baseUrl}/rss.xml`;

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/semafor',
    name: 'semafor',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(feedUrl);

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
        title: 'Semafor',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
