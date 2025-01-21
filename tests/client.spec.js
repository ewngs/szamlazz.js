/* eslint-env mocha */

import nock from 'nock'
import { expect, use as chaiUse } from 'chai'
import chaiAsPromised from '@rvagg/chai-as-promised'
chaiUse(chaiAsPromised)

import { Buyer, Client, Invoice, Item, Seller, CreditEntry } from '../index.js'
import {
  createClient,
  createTokenClient,
  createSeller,
  createBuyer,
  createSoldItemNet,
  createSoldItemGross,
  createInvoice,
  createCreditEntry,
  RESPONSE_FILE_PATHS
} from './resources/setup.js'

describe('Client', () => {
  let client
  let tokenClient
  let seller
  let buyer
  let soldItem1
  let soldItem2
  let invoice
  let reversalRequest
  let creditEntry
  let creditEntryOptions

  before(() => {
    nock.disableNetConnect()
  })

  beforeEach(() => {
    client = createClient(Client)
    tokenClient = createTokenClient(Client)
    seller = createSeller(Seller)
    buyer = createBuyer(Buyer)
    soldItem1 = createSoldItemNet(Item)
    soldItem2 = createSoldItemGross(Item)
    invoice = createInvoice(Invoice, seller, buyer, [soldItem1, soldItem2])
    reversalRequest = {
      invoiceId: 'E-RNJLO-2019-1234',  
      eInvoice: true,                  
      requestInvoiceDownload: false,   
    }
    creditEntry = createCreditEntry(CreditEntry)
    creditEntryOptions = {
      invoiceId: 'E-RNJLO-2019-1234',
      additiv: true,
      taxNumber: ''
    }
  })

  afterEach(() => {
    nock.cleanAll()
  })

  after(() => {
    nock.enableNetConnect()
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
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .reply(404)

        await expect(client.issueInvoice(invoice)).rejectedWith('Request failed with status code 404')
        nock.isDone()
      })
    })

    describe('service error response', () => {
      it('should throw error', async () => {
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .reply(200, undefined, {
            szlahu_error_code: '57',
            szlahu_error: 'Some error message from the remote service'
          })

        await expect(client.issueInvoice(invoice)).rejectedWith('Some error message from the remote service')
        nock.isDone()
      })
    })

    describe('successful invoice generation without download request', () => {
      beforeEach(() => {
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .replyWithFile(200, RESPONSE_FILE_PATHS.SUCCESS_WITHOUT_PDF, {
            szlahu_bruttovegosszeg: '6605',
            szlahu_nettovegosszeg: '5201',
            szlahu_szamlaszam: '2016-139',
            szlahu_vevoifiokurl: 'https://www.szamlazz.hu/szamla/fiok/gd82embu556d2qjagzj3s2ijqeqzds4ckhuf',

          })

        client.setRequestInvoiceDownload(false)
      })

      it('should have result parameter', async () => {
        const httpResponse = await client.issueInvoice(invoice)
        expect(httpResponse).to.have.all.keys(
          'invoiceId',
          'netTotal',
          'grossTotal',
          'customerAccountUrl'
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

      it('should have `customerAccountUrl` property', async () => {
        const httpResponse = await client.issueInvoice(invoice)
        expect(httpResponse.customerAccountUrl).to.be.equals('https://www.szamlazz.hu/szamla/fiok/gd82embu556d2qjagzj3s2ijqeqzds4ckhuf')
      })

      
    })

    describe('successful invoice generation with download request', () => {
      beforeEach(() => {
       nock('https://www.szamlazz.hu')
        .post('/szamla/')
        .replyWithFile(200, RESPONSE_FILE_PATHS.SUCCESS_WITH_PDF, {
          szlahu_bruttovegosszeg: '6605',
          szlahu_nettovegosszeg: '5201',
          szlahu_szamlaszam: '2016-139'
        })

        client.setRequestInvoiceDownload(true)
      })

      it('should have result parameter', async () => {
        const httpResponse = await client.issueInvoice(invoice)

        expect(httpResponse).to.have.all.keys(
          'invoiceId',
          'netTotal',
          'grossTotal',
          'customerAccountUrl',
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
      
      it('should have `customerAccountUrl` property', async () => {
        const httpResponse = await client.issueInvoice(invoice)
        expect(httpResponse).to.have.property('customerAccountUrl').that.is.satisfies((value) => typeof value === 'string' || value === undefined);
      }) 
    })
  })

  describe('reverseInvoice', () => {
    describe('HTTP status', () => {
      it('should handle failed requests', async () => {
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .reply(404)

        await expect(client.reverseInvoice(reversalRequest)).rejectedWith('Request failed with status code 404')
        nock.isDone()
      })
    })

    describe('successful invoice reversal without download request', () => {
      beforeEach(() => {
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .replyWithFile(200, RESPONSE_FILE_PATHS.SUCCESS_WITHOUT_PDF, {
            szlahu_bruttovegosszeg: '6605',
            szlahu_nettovegosszeg: '5201',
            szlahu_szamlaszam: '2016-139',
            szlahu_vevoifiokurl: 'https://www.szamlazz.hu/szamla/fiok/gd82embu556d2qjagzj3s2ijqeqzds4ckhuf',
          })

        client.setRequestInvoiceDownload(false)
      })

      it('should have result parameter', async () => {
        const httpResponse = await client.reverseInvoice(reversalRequest)
        expect(httpResponse).to.have.all.keys(
          'invoiceId',
          'netTotal',
          'grossTotal',
          'customerAccountUrl'
        )
      })

      it('should have `invoiceId` property', async () => {
        const httpResponse = await client.reverseInvoice(reversalRequest)

        expect(httpResponse).to.have.property('invoiceId').that.is.a('string')
      })

      it('should have `netTotal` property', async () => {
        const httpResponse = await client.reverseInvoice(reversalRequest)

        expect(parseFloat(httpResponse.netTotal)).is.a('number')
      })

      it('should have `grossTotal` property', async () => {
        const httpResponse = await client.reverseInvoice(reversalRequest)

        expect(parseFloat(httpResponse.grossTotal)).is.a('number')
      })

      it('should have `customerAccountUrl` property', async () => {
        const httpResponse = await client.reverseInvoice(reversalRequest)
        expect(httpResponse.customerAccountUrl).to.be.equals('https://www.szamlazz.hu/szamla/fiok/gd82embu556d2qjagzj3s2ijqeqzds4ckhuf')
      })

      
    })

  })

  describe('getInvoiceData', () => {
    describe('unsuccessful invoice generation', () => {
      beforeEach(() => {
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .replyWithFile(200, RESPONSE_FILE_PATHS.UNKNOWN_INVOICE_NUMBER)

        client.setRequestInvoiceDownload(true)
      })

      it('should throw error', async () => {
        await expect(client.getInvoiceData({
          invoiceId: 'TEST-ISSUE-NUMBER'
        })).rejectedWith('Hiányzó adat: számla agent xml lekérés hiba (ismeretlen számlaszám).')
      })
    })
  })

  describe('queryTaxPayer', () => {
    describe('when the taxpayer ID is invalid', () => {
      beforeEach(() => {
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .replyWithFile(200, RESPONSE_FILE_PATHS.INVALID_TAXPAYER);
      });
  
      it('should return taxpayerValidity as false', async () => {
        const result = await client.queryTaxPayer(12345678);
        
        expect(result).to.deep.equal({
          taxpayerValidity: false,
        });
      });
    });

    describe('when the taxpayer ID is valid', () => {
      beforeEach(() => {
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .replyWithFile(200, RESPONSE_FILE_PATHS.VALID_TAXPAYER);
      });
  
      it('should return correct taxpayer details', async () => {
        const result = await client.queryTaxPayer(12345678);
  
        expect(result).to.deep.equal({
          taxpayerValidity: true,
          taxpayerId: '12345678',
          vatCode: '2',
          countyCode: '41',
          taxpayerName: 'taxpayerName',
          taxpayerShortName: 'taxpayerShortName',
          address: {
            countryCode: 'HU',
            postalCode: '1000',
            city: 'BUDAPEST',
            streetName: 'TESZT',
            publicPlaceCategory: 'UTCA',
            number: '1.'
          },
        });
      });
    });
  
  })

  describe('registerCreditEntry', () => {
    describe('HTTP status', () => {
      it('should handle failed requests', async () => {
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .reply(404)

        await expect(client.registerCreditEntry(creditEntryOptions, [creditEntry])).rejectedWith('Request failed with status code 404')
        nock.isDone()
      })
    })

    describe('successful credit entry registration', () => {
      beforeEach(() => {
        nock('https://www.szamlazz.hu')
          .post('/szamla/')
          .replyWithFile(200, RESPONSE_FILE_PATHS.SUCCESS_WITHOUT_PDF, {
            szlahu_bruttovegosszeg: '6605',
            szlahu_nettovegosszeg: '5201',
            szlahu_szamlaszam: '2016-139',
            szlahu_vevoifiokurl: 'https://www.szamlazz.hu/szamla/fiok/gd82embu556d2qjagzj3s2ijqeqzds4ckhuf',

          })
      })

      it('should have result parameter', async () => {
        const httpResponse = await client.registerCreditEntry(creditEntryOptions, [creditEntry])
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
