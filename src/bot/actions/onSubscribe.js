const { updateSubscription } = require('../../subscriptions');

module.exports = ({ bot, db }) => message => {

  updateSubscription({ db, subscription: {} }).pipe(

  ).subscribe(console.log)
};
