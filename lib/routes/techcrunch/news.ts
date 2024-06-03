import { Route } from '@/types';
import cache from '@/utils/cache';
import parser from '@/utils/rss-parser';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
const host = 'https://techcrunch.com';
export const route: Route = {
    path: '/news',
    categories: ['new-media'],
    example: '/techcrunch/news',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['techcrunch.com/'],
        },
    ],
    name: 'News',
    maintainers: ['EthanWng97'],
    handler,
    url: 'techcrunch.com/',
};

async function handler() {
    const rssUrl = `${host}/feed/`;
    const feed = await parser.parseURL(rssUrl);

    const items = await Promise.all(
        feed.items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                const description = $('.entry-content p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n');

                return {
                    title: item.title,
                    pubDate: item.pubDate,
                    link: item.link,
                    category: item.categories,
                    description,
                };
            })
        )
    );

    return {
        title: 'TechCrunch',
        link: host,
        description: 'Reporting on the business of technology, startups, venture capital funding, and Silicon Valley.',
        item: items,
    };
}
