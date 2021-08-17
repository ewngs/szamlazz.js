'use strict'

const assert = require('assert')
const merge = require('merge')
const request = require('request')
const xml2js = require('xml2js')
const XMLUtils = require('./XMLUtils')

const xmlHeader =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<xmlszamla xmlns="http://www.szamlazz.hu/xmlszamla" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
  'xsi:schemaLocation="http://www.szamlazz.hu/xmlszamla xmlszamla.xsd">\n'

const xmlFooter = '</xmlszamla>'

const szamlazzURL = 'https://www.szamlazz.hu/szamla/'

const defaultOptions = {
  eInvoice: false,
  requestInvoiceDownload: false,
  downloadedInvoiceCount: 1,
  responseVersion: 1
}

class Client {
  constructor (options) {
    this._options = merge({}, defaultOptions, options || {})

    this.useToken = typeof this._options.authToken === 'string' && this._options.authToken.trim().length > 1

    if (!this.useToken) {
      assert(typeof this._options.user === 'string' && this._options.user.trim().length > 1,
      'Valid User field missing form client options')

      assert(typeof this._options.password === 'string' && this._options.password.trim().length > 1,
      'Valid Password field missing form client options')
    }

    this._cookieJar = request.jar()
  }

  getInvoiceData (options, cb) {
    const hasinvoiceId = typeof options.invoiceId === 'string' && options.invoiceId.trim().length > 1
    const hasOrderNumber = typeof options.orderNumber === 'string' && options.orderNumber.trim().length > 1
    assert(hasinvoiceId || hasOrderNumber, 'Either invoiceId or orderNumber must be specified')

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n\
      <xmlszamlaxml xmlns="http://www.szamlazz.hu/xmlszamlaxml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.szamlazz.hu/xmlszamlaxml http://www.szamlazz.hu/docs/xsds/agentpdf/xmlszamlaxml.xsd">\n' +
      XMLUtils.wrapWithElement([
        ...this._getAuthFields(),
        [ 'szamlaszam', options.invoiceId ],
        [ 'rendelesSzam', options.orderNumber ],
        [ 'pdf', options.pdf ]
      ]) +
      '</xmlszamlaxml>'

    this._sendRequest(
      'action-szamla_agent_xml',
      xml,
      'utf8',
      (httpResponse, cb) => {
        xml2js.parseString(httpResponse.body, (e, res) => {
          cb(e, res.szamla)
        })
      },
      cb)
  }

  reverseInvoice (options, cb) {
    assert(typeof options.invoiceId === 'string' && options.invoiceId.trim().length > 1, 'invoiceId must be specified')
    assert(options.eInvoice !== undefined, 'eInvoice must be specified')
    assert(options.requestInvoiceDownload !== undefined, 'requestInvoiceDownload must be specified')

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n\
      <xmlszamlast xmlns="http://www.szamlazz.hu/xmlszamlast" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.szamlazz.hu/xmlszamlast https://www.szamlazz.hu/szamla/docs/xsds/agentst/xmlszamlast.xsd">\n' +
      XMLUtils.wrapWithElement(
        'beallitasok', [
          ...this._getAuthFields(),
          [ 'eszamla', String(options.eInvoice) ],
          [ 'szamlaLetoltes', String(options.requestInvoiceDownload) ],
      ]) +
      XMLUtils.wrapWithElement(
        'fejlec', [
          [ 'szamlaszam', options.invoiceId ],
          [ 'keltDatum', new Date() ],
      ]) +
      '</xmlszamlast>'

    this._sendRequest(
      'action-szamla_agent_st',
      xml,
      'utf8',
      (httpResponse, cb) => {
        let pdf = null
        const contentType = httpResponse.headers['content-type']

        if (contentType && contentType.indexOf('application/pdf') === 0) {
          pdf = httpResponse.body
        }

        cb(null, {
          invoiceId: httpResponse.headers.szlahu_szamlaszam,
          netTotal: httpResponse.headers.szlahu_nettovegosszeg,
          grossTotal: httpResponse.headers.szlahu_bruttovegosszeg,
          pdf: pdf
        })
      },
      cb)
  }

  issueInvoice (invoice, cb) {
    this._sendRequest(
      'action-xmlagentxmlfile',
      this._generateInvoiceXML(invoice),
      null,
      (httpResponse, cb) => {
        cb(null, {
          invoiceId: httpResponse.headers.szlahu_szamlaszam,
          netTotal: httpResponse.headers.szlahu_nettovegosszeg,
          grossTotal: httpResponse.headers.szlahu_bruttovegosszeg
        });
      },
      cb)
  }

  setRequestInvoiceDownload (value) {
    this._options.requestInvoiceDownload = value
  }

  _getAuthFields () {
    let authFields = []

    if (this.useToken) {
      authFields = authFields.concat([
        [ 'szamlaagentkulcs', this._options.authToken ],
      ])
    } else {
      authFields = authFields.concat([
        [ 'felhasznalo', this._options.user ],
        [ 'jelszo', this._options.password ],
      ])
    }

    return authFields
  }

  _generateInvoiceXML (invoice) {
    return xmlHeader +
      XMLUtils.wrapWithElement('beallitasok', [
        ...this._getAuthFields(),
        [ 'eszamla', this._options.eInvoice ],
        [ 'szamlaLetoltes', this._options.requestInvoiceDownload ],
        [ 'szamlaLetoltesPld', this._options.downloadedInvoiceCount ],
        [ 'valaszVerzio', this._options.responseVersion ]
      ], 1) +
      invoice._generateXML(1) +
      xmlFooter
  }

  _sendRequest (fileFieldName, data, encoding, getResult, cb) {
    const formData = {}

    formData[ fileFieldName ] = {
      value: data,
      options: {
        filename: 'request.xml',
        contentType: 'text/xml'
      }
    }

    request({
      formData,
      method: 'POST',
      url: szamlazzURL,
      jar: this._cookieJar,
      encoding,
    }, (err, httpResponse, body) => {
      if (err) {
        return cb(err, body, httpResponse)
      }

      if (httpResponse.statusCode !== 200) {
        return cb(new Error(`${httpResponse.statusCode} ${httpResponse.statusMessage}`), body, httpResponse)
      }

      if (httpResponse.headers.szlahu_error_code) {
        err = new Error(decodeURIComponent(httpResponse.headers.szlahu_error.replace(/\+/g, ' ')))
        err.code = httpResponse.headers.szlahu_error_code
        return cb(err, body, httpResponse)
      }

      getResult(httpResponse, (err2, result) => {
        if (err2) {
          return cb(err, body, httpResponse)
        }

        if (this._options.requestInvoiceDownload) {
          if (this._options.responseVersion === 2) {
            XMLUtils.xml2obj(body, { 'xmlszamlavalasz.pdf': 'pdf' }, (err3, parsed) => {
              if (err3) {
                return cb(err3, body, httpResponse)
              }
              result.pdf = new Buffer(parsed.pdf, 'base64')
              cb(null, result, httpResponse)
            })
          } else {
            result.pdf = body
            cb(null, result, httpResponse)
          }
        } else {
          cb(null, result, httpResponse)
        }
      })
    })
  }
}

module.exports = Client
