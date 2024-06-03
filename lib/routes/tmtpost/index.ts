import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import { load } from 'cheerio';

const baseUrl = 'https://www.tmtpost.com';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/tmtpost',
    name: 'tmtpost',
    maintainers: ['Daring Cλlf'],
    handler,
    url: 'www.tmtpost.com',
};

async function handler() {
    const feed = await parser.parseURL(`${baseUrl}/feed`);

    const items = feed.items.map((item) => {
        const $ = load(item.contentEncoded);
        let description = $('p')
            .toArray()
            .map((el) => $(el).text())
            .join('\n');

        const index = description.indexOf('更多精彩内容，关注钛媒体');
        if (index !== -1) {
            description = description.substring(0, index);
        }

        description = description.trim();

        return {
            title: item.title,
            pubDate: item.pubDate,
            link: item.link,
            description,
        };
    });

    return {
        title: feed.title,
        link: feed.link,
        description: feed.description,
        item: items,
    };
}
