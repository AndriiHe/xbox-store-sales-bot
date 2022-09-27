
const express = require('express')
const app = express()
const { getChipestProduct } = require('../products');


function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }
  res.status(500)
  res.render('error', { error: err })
}

module.exports = {
  launch: ({ db, logger }) => {

    app.get('/sales', function (req, res) {
      const queryName = req.query.name ? req.query.name : ''
      const queryCurrency = req.query.currency ? req.query.currency : 'USD'
      const queryRegion = req.query.region ? req.query.region : 'AR'
      getChipestProduct({ db,  currency: queryCurrency,name: queryName, region: queryRegion }).subscribe(
        (product) => (res.send(product), errorHandler))
    })
    
    app.listen(3000)
  }
};