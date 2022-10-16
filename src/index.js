const Queue = require('bull');
const dotenv = require('dotenv');
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const logger = require('./logger');
const Db = require('./db');
const { handleJob } = require('./jobs');
const cron = require('./crons');
const { getProductPrices } = require('./products');
const onStart = require('./bot/actions/onStart');
const onCallback = require('./bot/actions/onCallback');
const onSubscribe = require('./bot/actions/onSubscribe');
const onUnsubscribe = require('./bot/actions/onUnsubscribe');
const { START, CALLBACK, SUBSCRIBE, UNSUBSCRIBE } = require('./bot/actions');

dotenv.config();

const port = process.env.PORT || 3000;
const db = new Db(process.env.DATABASE_URL);
const queue = new Queue('jobs', process.env.REDIS_URL);
const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(START, onStart({ db, bot }));
bot.onText(SUBSCRIBE, onSubscribe({ db, bot }));
bot.onText(UNSUBSCRIBE, onUnsubscribe({ db, bot }));
bot.on(CALLBACK, onCallback({ db, bot }));

queue.process(handleJob({ db, logger }));

cron.setup({ db, queue, logger });

app.use(express.json());

// TODO: move to separate file
app.get('/api/prices', (req, res) => {
  const page = +req.query.page || 1;
  const perPage = +req.query.perPage || 20;
  const regions = Array.isArray(req.query.region) ? req.query.region.map(r => r?.toUpperCase()) : [req.query.region?.toUpperCase()];
  const currency = req.query.currency?.toUpperCase() || 'USD';
  const name = req.query.name || '';
  const platform = 'Windows.Xbox';
  getProductPrices({ db, page, perPage, regions, currency, name, platform }).subscribe(
    prices => res.send({ prices, pagination: { page, perPage, items: prices.length } }),
    error => res.status(500).send({ status: error.status || 500, message: error.message }),
  );
});

app.listen(port, () => console.log(`🚀 Server started on ${port} port...`))


