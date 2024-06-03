import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import { load } from 'cheerio';

const baseUrl = 'https://www.theblockbeats.info';
const feedUrl = 'https://api.theblockbeats.news/v1/open-api/home-xml';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/theblockbeats',
    name: 'BlockBeats',
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
        title: '律动BlockBeats',
        link: baseUrl,
        item: items,
        language: 'zh-cn',
    };
}
