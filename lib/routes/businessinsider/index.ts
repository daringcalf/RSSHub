import { Route } from '@/types';
import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';

const baseUrl = 'https://www.businessinsider.com';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/businessinsider',
    name: 'businessinsider',
    maintainers: ['Daring Cλlf'],
    handler,
};

async function handler() {
    const response = await ofetch(baseUrl);
    const $ = load(response);

    const list = $('a.tout-title-link')
        .toArray()
        .map((item) => {
            const href = $(item).attr('href');
            const link = href.startsWith('http') ? href : baseUrl + href;
            return {
                title: $(item).text(),
                link,
            };
        });

    const items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);

                const $ = load(response);

                item.description = $('div.content-lock-content p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n');

                item.pubDate = new Date($('time[data-timestamp]').first().attr('data-timestamp') as string);

                return item;
            })
        )
    );

    return {
        title: 'business insider',
        link: baseUrl,
        item: items,
        language: 'en-us',
    };
}
