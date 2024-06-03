import { Route } from '@/types';
import { load } from 'cheerio';
import ofetch from '@/utils/ofetch';
import cache from '@/utils/cache';

const baseUrl = 'https://www.geekpark.net';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/geekpark',
    name: 'geekpark',
    maintainers: ['Daring Cλlf'],
    handler,
    url: 'www.geekpark.net',
};

async function handler() {
    const response = await ofetch(baseUrl);
    const $ = load(response);

    const list = $('article.article-item')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const $a = $item.find('a[data-event-category="article-list.title"]').first();
            return {
                title: $a.text(),
                link: `${baseUrl}${$a.attr('href')}`,
            };
        });

    const items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                item.description = $('.article-content')
                    .children()
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n');

                item.pubDate = new Date($('article header span.release-date').first().text());

                return item;
            })
        )
    );

    return {
        title: 'geekpark',
        link: baseUrl,
        item: items,
    };
}
