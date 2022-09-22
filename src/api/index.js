
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
      getChipestProduct({ db, name: queryName }).subscribe(
        (product) => (res.send(product), errorHandler))
    })
    
    app.listen(3000)
  }
};