const { SET_PROFILE_CURRENCY } = require('../actions');
const onSetProfileCurrency = require('./onSetProfileCurrency');
const { tryParse } = require('../../utils');

module.exports = ({ db, bot }) => callbackData => {
  const data = tryParse(callbackData.data);

  const actions = {
    [SET_PROFILE_CURRENCY]: onSetProfileCurrency({ db, bot }),
  };

  actions[data.action] && actions[data.action]({ ...callbackData, data });
};
