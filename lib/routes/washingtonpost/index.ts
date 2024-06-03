import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';

const baseUrl = 'https://www.washingtonpost.com';

export const route: Route = {
    path: '/',
    categories: ['other'],
    example: '/washingtonpost',
    name: 'washingtonpost',
    maintainers: ['Daring Cλlf'],
    handler,
    url: 'washingtonpost.com',
};

async function handler() {
    const response = await ofetch(`${baseUrl}/latest-headlines`);
    const $ = load(response);

    const list = $('.table-in-grid')
        .first()
        .find('.card')
        .toArray()
        .map((c) => {
            const $left = $(c).find('.card-left').first();
            const $a = $left.find('h2 a').first();
            return {
                title: $a.text(),
                link: $a.attr('href'),
            };
        });

    return {
        title: 'Washington Post',
        link: baseUrl,
        description: 'Washington Post News Feed',
        item: list,
    };
}
