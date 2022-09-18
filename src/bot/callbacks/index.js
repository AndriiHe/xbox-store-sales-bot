const onPrimaryRegionSelect = require('./onPrimaryRegionSelect');
const { SELECT_PRIMARY_REGION } = require('../actions');

const handleCallbackQuery = ({ db }) => (ctx) => {
  console.log(`Inline query`, ctx)
  ctx.answerCbQuery();
}

const handleText = ({ db }) => {
  const handlers = {
    [SELECT_PRIMARY_REGION]: onPrimaryRegionSelect({ db }),
  }
  return (ctx) => handlers[ctx?.session?.action](ctx)
}

module.exports = {
  handleCallbackQuery,
  handleText,
}
