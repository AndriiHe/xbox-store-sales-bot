const Queue = require('bull');
const dotenv = require('dotenv');
const logger = require('./logger');

const Db = require('./db');
const { handleJob } = require('./jobs');
const cron = require('./crons');
const bot = require('./bot');

dotenv.config();

const db = new Db(process.env.DATABASE_URL);
const queue = new Queue('jobs', process.env.REDIS_URL);
queue.process(handleJob({ db, logger }));

cron.setup({ db, queue, logger });
bot.launch({ db, logger });
