/* eslint-env mocha */
'use strict'

const fs = require('fs')
const path = require('path')
const xmljs = require('libxmljs2')
const axios = require('axios')
const sinon = require('sinon')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.use(chaiAsPromised)

const setup = require('./resources/setup')

let axiosStub

let client
let tokenClient
let seller
let buyer
let soldItem1
let soldItem2
let invoice

let Szamlazz

beforeEach(done => {
  axiosStub = sinon.stub(axios, 'post')
  Szamlazz = require('..')
  client = setup.createClient(Szamlazz)
  tokenClient = setup.createTokenClient(Szamlazz)
  seller = setup.createSeller(Szamlazz)
  buyer = setup.createBuyer(Szamlazz)
  soldItem1 = setup.createSoldItemNet(Szamlazz)
  soldItem2 = setup.createSoldItemGross(Szamlazz)
  invoice = setup.createInvoice(Szamlazz, seller, buyer, [soldItem1, soldItem2])

  done()
})

afterEach(done => {
  sinon.restore()
  done()
})

describe('Client', () => {
  afterEach(() => {
    sinon.reset()
  })
  describe('constructor', () => {
    it('should set _options property', done => {
      expect(client).to.have.property('_options').that.is.an('object')
      done()
    })

    it('should set user', done => {
      expect(client._options).to.have.property('user').that.is.a('string')
      done()
    })

    it('should set password', done => {
      expect(client._options).to.have.property('password').that.is.a('string')
      done()
    })
  })

  describe('_generateInvoiceXML', () => {
    it('should return valid XML', done => {
      fs.readFile(path.join(__dirname, 'resources', 'xmlszamla.xsd'), (err, data) => {
        if (!err) {
          let xsd = xmljs.parseXmlString(data)
          let xml = xmljs.parseXmlString(client._generateInvoiceXML(invoice))
          expect(xml.validate(xsd)).to.be.true
          done()
        }
      })
    })
  })

  describe('issueInvoice', () => {
    describe('HTTP status', () => {
      it('should handle failed requests', async () => {
        axiosStub.resolves(new Promise(r => r({ status: 404, statusText: 'Not found' })))

        try {
          await client.issueInvoice(invoice)
        } catch (e) {
          expect(e.message).to.be.string('404 Not found')
        }
      })
    })

    describe('service error response', () => {
      it('should throw error', async () => {
        axiosStub.resolves(new Promise(r => r({
          status: 200,
          headers: {
            szlahu_error_code: '57',
            szlahu_error: 'Some error message from the remote service'
          }
        })))

        try {
          await client.issueInvoice(invoice)
        } catch (e) {
          expect(e.message).to.be.string('Some error message from the remote service')
        }
      })
    })

    describe('successful invoice generation without download request', () => {
      beforeEach(done => {
        fs.readFile(path.join(__dirname, 'resources', 'success_without_pdf.xml'), (e, data) => {
          axiosStub.resolves(new Promise(r => r({
            status: 200,
            headers: {
              szlahu_bruttovegosszeg: '6605',
              szlahu_nettovegosszeg: '5201',
              szlahu_szamlaszam: '2016-139'
            },
            data: Buffer.from(data).toString('utf8')
          })))

          client.setRequestInvoiceDownload(false)
          done()
        })
      })

      it('should have result parameter', async () => {
        const httpResponse = await client.issueInvoice(invoice)
        expect(httpResponse).to.have.all.keys(
          'invoiceId',
          'netTotal',
          'grossTotal'
        )

      })

      it('should have `invoiceId` property', async () => {
        const httpResponse = await client.issueInvoice(invoice)

        expect(httpResponse).to.have.property('invoiceId').that.is.a('string')
      })

      it('should have `netTotal` property', async () => {
        const httpResponse = await client.issueInvoice(invoice)

        expect(parseFloat(httpResponse.netTotal)).is.a('number')
      })

      it('should have `grossTotal` property', async () => {
        const httpResponse = await client.issueInvoice(invoice)

        expect(parseFloat(httpResponse.grossTotal)).is.a('number')
      })
    })

    describe('successful invoice generation with download request', () => {
      beforeEach(done => {
        fs.readFile(path.join(__dirname, 'resources', 'success_with_pdf.xml'), (e, data) => {
          axiosStub.resolves(new Promise(r => r({
            status: 200,
            headers: {
              szlahu_bruttovegosszeg: '6605',
              szlahu_nettovegosszeg: '5201',
              szlahu_szamlaszam: '2016-139'
            },
            data: Buffer.from(data).toString('utf8')
          })))

          client.setRequestInvoiceDownload(true)
          done()
        })
      })

      it('should have result parameter', async () => {
        const httpResponse = await client.issueInvoice(invoice)

        expect(httpResponse).to.have.all.keys(
          'invoiceId',
          'netTotal',
          'grossTotal',
          'pdf'
        )
      })

      it('should have `invoiceId` property', async () => {
        const httpResposne = await client.issueInvoice(invoice)
        expect(httpResposne).to.have.property('invoiceId').that.is.a('string')
      })

      it('should have `netTotal` property', async () => {
        const httpResponse = await client.issueInvoice(invoice)
        expect(parseFloat(httpResponse.netTotal)).is.a('number')
      })

      it('should have `grossTotal` property', async () => {
        const httpResponse = await client.issueInvoice(invoice)
        expect(parseFloat(httpResponse.grossTotal)).is.a('number')
      })

      it('should have `pdf` property', async () => {
        const httpResponse = await client.issueInvoice(invoice)
        expect(httpResponse.pdf).to.be.an.instanceof(Buffer)
      })
    })
  })

  describe('getInvoiceData', () => {
    describe('unsuccessful invoice generation', () => {
      beforeEach(done => {
        fs.readFile(path.join(__dirname, 'resources', 'unknown_invoice_number.xml'), (e, data) => {
          axiosStub.resolves(new Promise(r => r({
            status: 200,
            headers: {},
            data: Buffer.from(data).toString('utf8')
          })))

          client.setRequestInvoiceDownload(true)
          done()
        })
      })

      it('should throw error', async () => {
        try {
          const res = await client.getInvoiceData({
            invoiceId: 'TEST-ISSUE-NUMBER'
          })
        } catch (e) {
          expect(e.message).to.be.string('Hiányzó adat: számla agent xml lekérés hiba (ismeretlen számlaszám).')
        }
      })
    })
  })
})

describe('Client with auth token', () => {
  describe('constructor', () => {
    it('should set _options property', done => {
      expect(tokenClient).to.have.property('_options').that.is.an('object')
      done()
    })

    it('should set authToken', done => {
      expect(tokenClient._options).to.have.property('authToken').that.is.a('string')
      done()
    })

    it('should not set user', done => {
      expect(tokenClient._options).to.not.have.property('user')
      done()
    })
    it('should not set password', done => {
      expect(tokenClient._options).to.not.have.property('password')
      done()
    })
  })

  describe('_generateInvoiceXML', () => {
    it('should return valid XML', done => {
      fs.readFile(path.join(__dirname, 'resources', 'xmlszamla.xsd'), (err, data) => {
        if (!err) {
          let xsd = xmljs.parseXmlString(data)
          let xml = xmljs.parseXmlString(tokenClient._generateInvoiceXML(invoice))
          expect(xml.validate(xsd)).to.be.true
          done()
        }
      })
    })
  })
})
