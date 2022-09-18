const { RxHR } = require('@akanass/rx-http-request');
const { v4: uuid } = require('uuid');

module.exports = RxHR.defaults({ json: true, headers: { 'MS-CV': uuid() }});
