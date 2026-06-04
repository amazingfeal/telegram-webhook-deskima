const express = require('express');



const TELEGRAM_SECRET_HEADER = 'x-telegram-bot-api-secret-token';

const PROXY_SECRET_HEADER = 'x-deskima-telegram-proxy-secret';

const DEFAULT_ORIGIN_WEBHOOK_URL =

  'https://deskima.ir/api/v1/webhooks/messenger/telegram';



const app = express();

app.use(express.json({ limit: '2mb' }));



app.get(['/', '/health'], (_req, res) => {

  res.type('text/plain').send('Telegram webhook running');

});



app.get('/webhook', (_req, res) => {

  res.json({ ok: true, service: 'deskima-telegram-proxy', route: 'webhook' });

});



// تلگرام → deskima.ir

app.post('/webhook', async (req, res) => {

  const origin = process.env.ORIGIN_WEBHOOK_URL || DEFAULT_ORIGIN_WEBHOOK_URL;



  try {

    const headers = {

      Accept: 'application/json',

      'Content-Type': 'application/json',

    };



    const telegramSecret = req.get(TELEGRAM_SECRET_HEADER);

    if (telegramSecret) {

      headers['X-Telegram-Bot-Api-Secret-Token'] = telegramSecret;

    }



    const upstream = await fetch(origin, {

      method: 'POST',

      headers,

      body: JSON.stringify(req.body ?? {}),

    });



    const text = await upstream.text();

    res.status(upstream.status).type('application/json').send(text);

  } catch (error) {

    console.error('webhook forward failed', error);

    res.status(502).json({ ok: false, error: 'Upstream webhook failed' });

  }

});



// deskima.ir → api.telegram.org

app.all(/^\/bot.*$/, async (req, res) => {

  const proxySecret = process.env.PROXY_SECRET;



  if (proxySecret && req.get(PROXY_SECRET_HEADER) !== proxySecret) {

    res.status(401).send('Unauthorized');

    return;

  }



  const apiOrigin = (

    process.env.TELEGRAM_API_ORIGIN || 'https://api.telegram.org'

  ).replace(/\/$/, '');

  const target = `${apiOrigin}${req.originalUrl}`;



  try {

    const headers = { 'Content-Type': 'application/json' };

    const init = { method: req.method, headers };



    if (!['GET', 'HEAD'].includes(req.method)) {

      init.body = JSON.stringify(req.body ?? {});

    }



    const upstream = await fetch(target, init);

    const text = await upstream.text();



    res.status(upstream.status).type('application/json').send(text);

  } catch (error) {

    console.error('bot api forward failed', error);

    res.status(502).json({ ok: false, error: 'Telegram API unreachable' });

  }

});



const port = Number(process.env.PORT || 3000);

app.listen(port, () => {

  console.log(`Deskima Telegram proxy listening on :${port}`);

});
