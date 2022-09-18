const { Telegraf } = require('telegraf');

const { of, lastValueFrom, isObservable } = require('rxjs');

const toPromise = function(func) {
  return async (...args) => {
    const result = func(...args);
    return await lastValueFrom(isObservable(result) ? result : of(result));
  };
};

module.exports = function (token) {
  const bot = new Telegraf(token);
  return new Proxy(bot, {
    get: (_, property) => (...args) => {
      if (typeof bot[property] !== 'function')
        return bot[property];
      return of(bot[property](...args.map(argument => (typeof argument === 'function') ? toPromise(argument) : argument)));
    }
  })
}
