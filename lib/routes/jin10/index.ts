import { Route } from '@/types';
import { load } from 'cheerio';
import ofetch from '@/utils/ofetch';
import cache from '@/utils/cache';
import { parseRelativeDate } from '@/utils/parse-date';

const baseUrl = 'https://xnews.jin10.com';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/jin10',
    name: 'jin10 toutiao',
    maintainers: ['Daring Cλlf'],
    handler,
    url: baseUrl,
};

async function handler() {
    const response = await ofetch(baseUrl);
    const $ = load(response);

    let list = $('div.jin10-news-list div.jin10-news-list-item')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const $a = $item.find('div.jin10-news-list-item-info a').first();
            return {
                title: $a.find('p.jin10-news-list-item-title').text().trim(),
                link: $a.attr('href'),
                pubDate: parseRelativeDate($item.find('span.jin10-news-list-item-display_datetime').text().trim()),
            };
        });

    list = list.filter((item) => item.link && item.link.startsWith(baseUrl));

    let items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                item.description = $('.jin10vip-image-viewer *[style="text-align: justify;"]')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n')
                    .trim();

                return item;
            })
        )
    );

    items = items.filter((item) => item && item.description && item.pubDate instanceof Date && !Number.isNaN(item.pubDate.getTime()));

    return {
        title: 'jin10',
        link: baseUrl,
        item: items,
    };
}
