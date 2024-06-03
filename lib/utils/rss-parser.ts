import { config } from '@/config';
import Parser from 'rss-parser';

const parser = new Parser({
    customFields: {
        item: [['magnet'], ['content:encoded', 'contentEncoded']],
    },
    headers: {
        'User-Agent': config.ua,
        Accept: 'application/rss+xml, application/xml',
    },
});

export default parser;
