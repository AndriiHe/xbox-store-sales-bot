const { tap, mergeMap } = require('rxjs/operators');
const { from } = require('rxjs');
const { Markup } = require('telegraf');
const { getRegions } = require('../../regions');
const { SELECT_PRIMARY_REGION } = require('../actions');

module.exports = ({ db }) => (ctx) => getRegions({ db }).pipe(
  tap(() => ctx.session.action = SELECT_PRIMARY_REGION),
  mergeMap(regions => from(ctx.reply(
    'Select your primary region',
    Markup.keyboard(regions.map(region => Markup.button.text(region)), { columns: 6 }).oneTime().resize()
  ))),
)
