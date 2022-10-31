'use strict'

const _modules = [ 'Buyer', 'Client', 'Invoice', 'Item', 'Seller', 'Receipt', 'ReceiptItem', 'ReceiptPayment' ]

_modules.forEach(n => {
  exports[ n ] = require('./lib/' + n)
})

require('./lib/Constants').setup(exports)
