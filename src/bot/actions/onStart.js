const { mergeMap } = require('rxjs/operators');
const { from } = require('rxjs');

const { getUser, upsertUser } = require('../../users');
const { getCurrencies } = require('../../exchangeRates');
const { chunks } = require('../../utils');
const { SET_PROFILE_CURRENCY } = require('../actions');

const homeText = 'Create a subscription to receive xbox store updates\n/subscribe - Create a subscription and receive updates\n/unsubscribe - Remove existing subscription';

const getCurrencyKeyboard = (currencies) => ({
  reply_markup: {
    inline_keyboard: chunks(currencies.map(currency => ({
      text: currency,
      callback_data: JSON.stringify({ action: SET_PROFILE_CURRENCY, currency }),
    })), 6),
  },
});

module.exports = ({ bot, db }) => message => {
  const user = { id: message.from.id, name: message.from.username };

  getUser({ db, id: message.from.id }).pipe(
    mergeMap(() => upsertUser({ db, user })),
    mergeMap(user => user.currency
      ? from(bot.sendMessage(message.chat.id, homeText))
      : getCurrencies({ db }).pipe(mergeMap(currencies => from(bot.sendMessage(message.chat.id, 'Choose your primary currency', getCurrencyKeyboard(currencies)))))
    ),
  ).subscribe();
};
