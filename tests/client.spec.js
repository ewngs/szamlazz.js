/* eslint-env mocha */

import fs from 'fs'
import path from 'path'
import axios from 'axios'
import sinon from 'sinon'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
const expect = chai.expect
chai.use(chaiAsPromised)

import {Buyer, Client, Invoice, Item, Seller} from '../index.js'
import {createClient, createTokenClient, createSeller, createBuyer, createSoldItemNet, createSoldItemGross, createInvoice} from './resources/setup.js'

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Client', () => {
  let axiosStub

  let client
  let tokenClient
  let seller
  let buyer
  let soldItem1
  let soldItem2
  let invoice

  before(() => {
    axiosStub = sinon.stub(axios, 'post')
  })

  beforeEach(() => {
    client = createClient(Client)
    tokenClient = createTokenClient(Client)
    seller = createSeller(Seller)
    buyer = createBuyer(Buyer)
    soldItem1 = createSoldItemNet(Item)
    soldItem2 = createSoldItemGross(Item)
    invoice = createInvoice(Invoice, seller, buyer, [soldItem1, soldItem2])
  })

  afterEach(() => {
    sinon.reset()
  })

  after(() => {
    sinon.restore()
  })

  describe('constructor', () => {
    it('should set _options property', () => {
      expect(client).to.have.property('_options').that.is.an('object')
    })

    it('should set user', () => {
      expect(client._options).to.have.property('user').that.is.a('string')
    })

    it('should set password', () => {
      expect(client._options).to.have.property('password').that.is.a('string')
    })
  })

  describe('issueInvoice', () => {
    describe('HTTP status', () => {
      it('should handle failed requests', async () => {
        axiosStub.resolves(new Promise(r => r({ status: 404, statusText: 'Not found' })))

        await expect(client.issueInvoice(invoice)).rejectedWith('404 Not found')
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

        await expect(client.issueInvoice(invoice)).rejectedWith('Some error message from the remote service')
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
        await expect(client.getInvoiceData({
          invoiceId: 'TEST-ISSUE-NUMBER'
        })).rejectedWith('Hiányzó adat: számla agent xml lekérés hiba (ismeretlen számlaszám).')
      })
    })
  })
})

describe('Client with auth token', () => {
  describe('constructor', () => {
    let tokenClient

    beforeEach(() => {
      tokenClient = createTokenClient(Client)
    })

    it('should set _options property', () => {
      expect(tokenClient).to.have.property('_options').that.is.an('object')
    })

    it('should set authToken', () => {
      expect(tokenClient._options).to.have.property('authToken').that.is.a('string')
    })

    it('should not set user', () => {
      expect(tokenClient._options).to.not.have.property('user')
    })
    it('should not set password', () => {
      expect(tokenClient._options).to.not.have.property('password')
    })
  })

})
