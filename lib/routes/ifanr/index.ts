import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import { load } from 'cheerio';

const baseUrl = 'https://www.ifanr.com';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/ifanr',
    name: 'ifanr',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const feed = await parser.parseURL(`${baseUrl}/feed`);

    const items = feed.items.map((item) => {
        const $ = load(item.contentEncoded);
        let description = $('p')
            .toArray()
            .map((el) => $(el).text())
            .join('\n');

        const index = description.indexOf('#欢迎关注爱范儿官方微信公众号');
        if (index !== -1) {
            description = description.substring(0, index);
        }

        return {
            title: item.title,
            pubDate: item.pubDate,
            link: item.link,
            description: description.trim(),
        };
    });

    return {
        title: 'ifanr',
        link: baseUrl,
        item: items,
        language: 'zh-cn',
    };
}
