import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import { load } from 'cheerio';

const baseUrl = 'https://36kr.com';
const feedUrl = `${baseUrl}/feed`;

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/36kr',
    name: '36kr',
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
            description: description || item.content,
        };
    });

    return {
        title: '36kr',
        link: baseUrl,
        item: items,
        language: 'zh-cn',
    };
}
