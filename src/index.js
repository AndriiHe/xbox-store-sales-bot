const Queue = require('bull');
const dotenv = require('dotenv');
const express = require('express');

const logger = require('./logger');
const Db = require('./db');
const { handleJob } = require('./jobs');
const cron = require('./crons');
const { getProductPrices } = require('./products');

dotenv.config();

const port = process.env.PORT || 3000;
const db = new Db(process.env.DATABASE_URL);
const queue = new Queue('jobs', process.env.REDIS_URL);
const app = express();

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


