const { getRegions } = require('../../regions');
const { mergeMap, catchError } = require('rxjs/operators');
const { from, pipe, throwError, of } = require('rxjs');
const { Markup } = require('telegraf');



const throwIf = (predicate, error) => pipe(
  mergeMap(value => predicate(value) ? throwError(error) : of(value))
);

module.exports = ({ db }) => (ctx) => getRegions({ db }).pipe(
  mergeMap(regions => of(regions).pipe(
    throwIf(regions => !regions.includes(ctx.message?.text), new Error()),
    mergeMap(() => from(ctx.reply('Hi'))),
    mergeMap(() => from(ctx.reply('there'))),
    mergeMap(() => from(ctx.reply('!'))),
    catchError(() => from(ctx.reply(
      `'${ctx.message?.text}' is an invalid region! Please select an existing region`,
      Markup.keyboard(regions.map(region => Markup.button.text(region)), { columns: 6 }).oneTime().resize()
    )))
  )),
  // mergeMap(regions => ctx.reply('there')),
  // mergeMap(regions => ctx.reply('!')),
)
