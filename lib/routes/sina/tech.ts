import { Route } from '@/types';
import { load } from 'cheerio';
import ofetch from '@/utils/ofetch';
import cache from '@/utils/cache';
import moment from 'moment-timezone';

const baseUrl = 'https://tech.sina.com.cn';

export const route: Route = {
    path: '/tech',
    categories: ['other'],
    example: '/sina/tech',
    name: 'sina tech',
    maintainers: ['Daring Cλlf'],
    handler,
    url: baseUrl,
};

async function handler() {
    const response = await ofetch(baseUrl);
    const $ = load(response);

    const list = $('div.tech-news li[data-sudaclick^="yaowenlist-"]')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const $a = $item.find('a').first();
            return {
                title: $a.text(),
                link: $a.attr('href'),
            };
        });

    let items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link);
                const $ = load(response);

                item.description = $('.article p')
                    .toArray()
                    .map((el) => $(el).text())
                    .join('\n')
                    .trim();

                item.pubDate = moment.tz($('.date-source span.date').first().text(), 'YYYY年MM月DD日 HH:mm', 'Asia/Shanghai').toDate();

                return item;
            })
        )
    );

    items = items.filter((item) => item && item.pubDate instanceof Date && !Number.isNaN(item.pubDate.getTime()));

    return {
        title: 'sina tech',
        link: baseUrl,
        item: items,
    };
}
