const TELEGRAM_SECRET = 'x-telegram-bot-api-secret-token';

const PROXY_SECRET = 'x-deskima-telegram-proxy-secret';

const DEFAULT_ORIGIN = 'https://deskima.ir/api/v1/webhooks/messenger/telegram';



export default async function handler(req, res) {

  const url = new URL(req.url, `https://${req.headers.host}`);

  const path = url.pathname;



  if (path === '/' || path === '/health') {

    res.status(200).send('Telegram webhook running');

    return;

  }



  if (path === '/webhook') {

    if (req.method === 'GET') {

      res.status(200).json({ ok: true, route: 'webhook' });

      return;

    }



    if (req.method !== 'POST') {

      res.status(405).end();

      return;

    }



    const origin = process.env.ORIGIN_WEBHOOK_URL || DEFAULT_ORIGIN;

    const headers = {

      Accept: 'application/json',

      'Content-Type': 'application/json',

    };



    if (req.headers[TELEGRAM_SECRET]) {

      headers['X-Telegram-Bot-Api-Secret-Token'] = req.headers[TELEGRAM_SECRET];

    }



    const upstream = await fetch(origin, {

      method: 'POST',

      headers,

      body: JSON.stringify(req.body ?? {}),

    });



    const text = await upstream.text();

    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);

    return;

  }



  if (path.startsWith('/bot')) {

    if (process.env.PROXY_SECRET && req.headers[PROXY_SECRET] !== process.env.PROXY_SECRET) {

      res.status(401).send('Unauthorized');

      return;

    }



    const apiOrigin = (process.env.TELEGRAM_API_ORIGIN || 'https://api.telegram.org').replace(/\/$/, '');

    const target = `${apiOrigin}${path}${url.search}`;



    const init = {

      method: req.method,

      headers: { 'Content-Type': 'application/json' },

    };



    if (req.method !== 'GET' && req.method !== 'HEAD') {

      init.body = JSON.stringify(req.body ?? {});

    }



    const upstream = await fetch(target, init);

    const text = await upstream.text();

    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);

    return;

  }



  res.status(404).send('Not found');

}

