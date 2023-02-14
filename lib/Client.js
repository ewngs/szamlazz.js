import assert from 'assert'
import merge from 'merge'
import axios from 'axios'
import FormData from 'form-data'
import {parseString, wrapWithElement, xml2obj} from './XMLUtils.js'
import axiosCookieJarSupportModule from 'axios-cookiejar-support'
const axiosCookieJarSupport = axiosCookieJarSupportModule.default
import tough from 'tough-cookie'

axiosCookieJarSupport(axios)

const defaultOptions = {
  eInvoice: false,
  requestInvoiceDownload: false,
  downloadedInvoiceCount: 1,
  responseVersion: 1,
  timeout: 0,
}

export class Client {
  constructor (options) {
    this._options = merge({}, defaultOptions, options || {})

    this.useToken = typeof this._options.authToken === 'string' && this._options.authToken.trim().length > 1

    if (!this.useToken) {
      assert(typeof this._options.user === 'string' && this._options.user.trim().length > 1,
      'Valid User field missing form client options')

      assert(typeof this._options.password === 'string' && this._options.password.trim().length > 1,
      'Valid Password field missing form client options')
    }

    this._cookieJar = new tough.CookieJar()
  }

  async getInvoiceData (options) {
    const hasInvoiceId = typeof options.invoiceId === 'string' && options.invoiceId.trim().length > 1
    const hasOrderNumber = typeof options.orderNumber === 'string' && options.orderNumber.trim().length > 1
    assert(hasInvoiceId || hasOrderNumber, 'Either invoiceId or orderNumber must be specified')

    const xml = this._getXmlHeader('xmlszamlaxml', 'agentxml') +
      wrapWithElement([
        ...this._getAuthFields(),
        ['szamlaszam', options.invoiceId],
        ['rendelesSzam', options.orderNumber],
        ['pdf', options.pdf]
      ]) +
      '</xmlszamlaxml>'

    const response = await this._sendRequest('action-szamla_agent_xml', xml)
    const parsedBody = await parseString(response.data)

    return parsedBody.szamla
  }

  async reverseInvoice (options) {
    assert(typeof options.invoiceId === 'string' && options.invoiceId.trim().length > 1, 'invoiceId must be specified')
    assert(options.eInvoice !== undefined, 'eInvoice must be specified')
    assert(options.requestInvoiceDownload !== undefined, 'requestInvoiceDownload must be specified')

    const xml = this._getXmlHeader('xmlszamlast', 'agentst') +
      wrapWithElement(
        'beallitasok', [
          ...this._getAuthFields(),
          ['eszamla', String(options.eInvoice)],
          ['szamlaLetoltes', String(options.requestInvoiceDownload)],
        ]) +
      wrapWithElement(
        'fejlec', [
          ['szamlaszam', options.invoiceId],
          ['keltDatum', new Date()],
        ]) +
      '</xmlszamlast>'

    const httpResponse = await this._sendRequest('action-szamla_agent_st', xml, true)

    const data = {
      invoiceId: httpResponse.headers.szlahu_szamlaszam,
      netTotal: httpResponse.headers.szlahu_nettovegosszeg,
      grossTotal: httpResponse.headers.szlahu_bruttovegosszeg
    }

    if (options.requestInvoiceDownload) {
      data.pdf = httpResponse.data
    }

    return data
  }

  async issueInvoice (invoice) {
    const xml = this._getXmlHeader('xmlszamla', 'agent') +
      wrapWithElement('beallitasok', [
        ...this._getAuthFields(),
        [ 'eszamla', this._options.eInvoice ],
        [ 'szamlaLetoltes', this._options.requestInvoiceDownload ],
        [ 'szamlaLetoltesPld', this._options.downloadedInvoiceCount ],
        [ 'valaszVerzio', this._options.responseVersion ]
      ], 1) +
      invoice._generateXML(1) +
      '</xmlszamla>'

    const httpResponse = await this._sendRequest('action-xmlagentxmlfile', xml, this._options.responseVersion === 1)

    const data = {
      invoiceId: httpResponse.headers.szlahu_szamlaszam,
      netTotal: httpResponse.headers.szlahu_nettovegosszeg,
      grossTotal: httpResponse.headers.szlahu_bruttovegosszeg,
    }

    if (this._options.requestInvoiceDownload) {
      if (this._options.responseVersion === 1) {
        data.pdf = Buffer.from(httpResponse.data)
      } else if (this._options.responseVersion === 2) {
        const parsed = await xml2obj(httpResponse.data, { 'xmlszamlavalasz.pdf': 'pdf' })
        data.pdf = Buffer.from(parsed.pdf, 'base64')
      }
    }
    return data
  }

  _getXmlHeader (tag, dir) {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <${tag} xmlns="http://www.szamlazz.hu/${tag}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.szamlazz.hu/${tag} https://www.szamlazz.hu/szamla/docs/xsds/${dir}/${tag}.xsd">\n`
  }

  _getAuthFields () {
    const tokenAuthFields = [
      [ 'szamlaagentkulcs', this._options.authToken ],
    ]
    const userAuthFields = [
      [ 'felhasznalo', this._options.user ],
      [ 'jelszo', this._options.password ],
    ]
    return this.useToken ? tokenAuthFields : userAuthFields
  }

  async _sendRequest (fileFieldName, data, isBinaryDownload) {
    const formData = new FormData()
    formData.append(fileFieldName, data, 'request.xml')

    const axiosOptions = {
      headers: {
        ...formData.getHeaders()
      },
      jar: this._cookieJar,
      withCredentials: true,
      timeout: this._options.timeout,
    }

    if (isBinaryDownload) {
      axiosOptions.responseType = 'arraybuffer'
      axiosOptions.reponseEncoding = 'binary'
    }

    const httpResponse = await axios.post('https://www.szamlazz.hu/szamla/', formData.getBuffer(), axiosOptions)
    if (httpResponse.status !== 200) {
      throw new Error(`${httpResponse.status} ${httpResponse.statusText}`)
    }

    if (httpResponse.headers.szlahu_error_code) {
      const err = new Error(decodeURIComponent(httpResponse.headers.szlahu_error.replace(/\+/g, ' ')))
      err.code = httpResponse.headers.szlahu_error_code
      throw err
    }

    if (isBinaryDownload) {
      return httpResponse
    }

    const parsedBody = await parseString(httpResponse.data)

    if (parsedBody.xmlszamlavalasz && parsedBody.xmlszamlavalasz.hibakod) {
      const error = new Error(parsedBody.xmlszamlavalasz.hibauzenet)
      error.code = parsedBody.xmlszamlavalasz.hibakod[0]
      throw error
    }

    return httpResponse
  }

  setRequestInvoiceDownload (value) {
    this._options.requestInvoiceDownload = value
  }
}
