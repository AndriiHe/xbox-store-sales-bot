const RedisSession = require('telegraf-session-redis');
const RxBot = require('../rxBot');
const { onStart } = require('./commands');
const { handleCallbackQuery, handleText } = require('./callbacks');


module.exports = {
  launch: ({ db, logger }) => {
    const bot = new RxBot(process.env.BOT_TOKEN);
    const session = new RedisSession({ store: { url: process.env.REDIS_URL } });
    bot.use(session.middleware());

    bot.command('start', onStart({ db }));
    bot.on('callback_query', handleCallbackQuery({ db }));
    bot.on('text', handleText({ db }))

    bot.startPolling();

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
};
