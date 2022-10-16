const { mergeMap } = require('rxjs/operators');
const { from } = require('rxjs');
const { upsertUser } = require('../../users');

const homeText = 'Create a subscription to receive xbox store updates\n/subscribe - Create a subscription and receive updates\n/unsubscribe - Remove existing subscription';

module.exports = ({ db, bot }) => ({ message, data, id }) => {
  const chatId = message.chat.id;

  upsertUser({ db, user: { id: chatId, currency: data?.currency?.toUpperCase() }}).pipe(
    mergeMap(() => from(bot.answerCallbackQuery(id))),
    mergeMap(() => from(bot.editMessageText(homeText, { message_id: message.message_id, chat_id: chatId } ))),
  ).subscribe();
};
