import { Route } from '@/types';
import parser from '@/utils/rss-parser';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';

const baseUrl = 'https://www.theguardian.com';

export const route: Route = {
    path: '/:channel?',
    categories: ['other'],
    example: '/theguardian',
    name: 'The Guardian',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler(ctx) {
    const { channel = 'us-news' } = ctx.req.param();
    const feed = await parser.parseURL(`${baseUrl}/${channel}/rss`);

    const items = await Promise.all(
        feed.items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                const paragraphs = $('#maincontent p');

                const description = paragraphs
                    .map((_, el) => $(el).html())
                    .get()
                    .join(' ');

                return { title: item.title, pubDate: item.pubDate, link: item.link, description };
            })
        )
    );

    return {
        title: 'The Guardian',
        link: 'https://www.theguardian.com',
        item: items,
        language: 'en-us',
    };
}
