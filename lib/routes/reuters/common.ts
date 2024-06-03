import { Route } from '@/types';

import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
import logger from '@/utils/logger';
import puppeteer from '@/utils/puppeteer';

export const route: Route = {
    path: '/:category/:topic?',
    categories: ['traditional-media'],
    example: '/reuters/world/us',
    parameters: { category: 'find it in the URL, or tables below', topic: 'find it in the URL, or tables below' },
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
            source: ['reuters.com/:category/:topic?', 'reuters.com/'],
        },
    ],
    name: 'Category/Topic/Author',
    maintainers: ['LyleLee', 'HenryQW', 'proletarius101', 'black-desk', 'nczitzk'],
    handler,
    description: `-   \`:category\`:

      | World | Business | Legal | Markets | Breakingviews | Technology | Graphics |
      | ----- | -------- | ----- | ------- | ------------- | ---------- | -------- |
      | world | business | legal | markets | breakingviews | technology | graphics |

  -   \`world/:topic\`:

      | All | Africa | Americas | Asia Pacific | China | Europe | India | Middle East | United Kingdom | United States | The Great Reboot | Reuters Next |
      | --- | ------ | -------- | ------------ | ----- | ------ | ----- | ----------- | -------------- | ------------- | ---------------- | ------------ |
      |     | africa | americas | asia-pacific | china | europe | india | middle-east | uk             | us            | the-great-reboot | reuters-next |

  -   \`business/:topic\`:

      | All | Aerospace & Defense | Autos & Transportation | Energy | Environment | Finance | Healthcare & Pharmaceuticals | Media & Telecom | Retail & Consumer | Sustainable Business | Charged | Future of Health | Future of Money | Take Five | Reuters Impact |
      | --- | ------------------- | ---------------------- | ------ | ----------- | ------- | ---------------------------- | --------------- | ----------------- | -------------------- | ------- | ---------------- | --------------- | --------- | -------------- |
      |     | aerospace-defense   | autos-transportation   | energy | environment | finance | healthcare-pharmaceuticals   | media-telecom   | retail-consumer   | sustainable-business | charged | future-of-health | future-of-money | take-five | reuters-impact |

  -   \`legal/:topic\`:

      | All | Government | Legal Industry | Litigation | Transactional |
      | --- | ---------- | -------------- | ---------- | ------------- |
      |     | government | legalindustry  | litigation | transactional |

  -   \`authors/:topic\`:

      | Default | Jonathan Landay | any other authors |
      | ------- | --------------- | ----------------- |
      | reuters | jonathan-landay | their name in URL |

  More could be found in the URL of the category/topic page.`,
};

async function handler(ctx) {
    const MUST_FETCH_BY_TOPICS = new Set(['authors', 'tags']);
    const CAN_USE_SOPHI = ['world'];

    const category = ctx.req.param('category');
    const topic = ctx.req.param('topic') ?? (category === 'authors' ? 'reuters' : '');
    const limit = ctx.req.query('limit') ? Number.parseInt(ctx.req.query('limit')) : 20;
    const useSophi = ctx.req.query('sophi') === 'true' && topic !== '' && CAN_USE_SOPHI.includes(category);

    const section_id = `/${category}/${topic ? `${topic}/` : ''}`;
    const { title, description, rootUrl, response } = await (async () => {
        if (MUST_FETCH_BY_TOPICS.has(category)) {
            const rootUrl = 'https://www.reuters.com/pf/api/v3/content/fetch/articles-by-topic-v1';
            const response = await ofetch(rootUrl, {
                query: {
                    query: JSON.stringify({
                        offset: 0,
                        size: limit,
                        topic_url: section_id,
                        website: 'reuters',
                    }),
                },
            });

            return {
                title: `${response.result.topics[0].name} | Reuters`,
                description: response.result.topics[0].entity_id,
                rootUrl,
                response,
            };
        } else {
            const rootUrl = 'https://www.reuters.com/pf/api/v3/content/fetch/articles-by-section-alias-or-id-v1';
            const response = await ofetch(rootUrl, {
                query: {
                    query: JSON.stringify({
                        offset: 0,
                        size: limit,
                        section_id,
                        website: 'reuters',
                        ...(useSophi
                            ? {
                                  fetch_type: 'sophi',
                                  sophi_page: '*',
                                  sophi_widget: 'topic',
                              }
                            : {}),
                    }),
                },
            });
            return {
                title: response.result.section.title,
                description: response.result.section.section_about,
                rootUrl,
                response,
            };
        }
    })();

    let items = response.result.articles.map((e) => ({
        title: e.title,
        link: new URL(e.canonical_url, rootUrl).href,
        guid: e.id,
        pubDate: parseDate(e.published_time),
        updated: parseDate(e.updated_time),
        author: e.authors.map((e) => e.name).join(', '),
        category: e.kicker.names,
        description: e.description,
    }));

    items = items.filter((e, i) => items.findIndex((f) => e.guid === f.guid) === i);

    const browser = await puppeteer();

    items = await Promise.all(
        items.map((item) =>
            cache.tryGet(item.link, async () => {
                const page = await browser.newPage();
                await page.setRequestInterception(true);
                page.on('request', (request) => {
                    request.resourceType() === 'document' ? request.continue() : request.abort();
                });
                logger.http(`Requesting ${item.link}`);
                await page.goto(item.link, {
                    waitUntil: 'domcontentloaded',
                });
                const response = await page.content();
                page.close();
                const $ = load(response);

                const paragraphs = $('div[data-testid^="paragraph-"]');

                item.description = paragraphs
                    .map((_, el) => $(el).html())
                    .get()
                    .join(' ');

                return item;
            })
        )
    );

    browser.close();

    return {
        title,
        description,
        image: 'https://www.reuters.com/pf/resources/images/reuters/logo-vertical-default-512x512.png?d=116',
        link: `https://www.reuters.com${section_id}`,
        item: items,
    };
}
