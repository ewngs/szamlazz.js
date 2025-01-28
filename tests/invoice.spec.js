/* eslint-env mocha */

import xml2js from 'xml2js'
import { expect } from 'chai'

import { Buyer, Invoice, Item, Seller } from '../index.js'
import { createSeller, createBuyer, createSoldItemNet, createSoldItemGross, createInvoice } from './resources/setup.js'
import { Currency, Language, PaymentMethod } from "../lib/Constants.js"

describe('Invoice', function () {
  let seller
  let buyer
  let soldItem1
  let soldItem2
  let invoice

  beforeEach(function () {
    seller = createSeller(Seller)
    buyer = createBuyer(Buyer)
    soldItem1 = createSoldItemNet(Item)
    soldItem2 = createSoldItemGross(Item)
    invoice = createInvoice(Invoice, seller, buyer, [soldItem1, soldItem2])
  })

  describe('constructor', function () {
    it('should set _options property', function () {
      expect(invoice).to.have.property('_options').that.is.an('object')
    })

    it('should set seller', function () {
      expect(invoice._options).to.have.property('seller').to.be.an.instanceof(Seller)
    })

    it('should set buyer', function () {
      expect(invoice._options).to.have.property('buyer').to.be.an.instanceof(Buyer)
    })

    it('should set items', function () {
      expect(invoice._options).to.have.property('items').that.is.an('array')
    })
  })
  describe('_generateXML', function () {
    it('should return valid XML', async function () {
      const result = await xml2js.parseStringPromise('<wrapper>' + invoice._generateXML() + '</wrapper>')

      expect(result).to.have.property('wrapper').that.is.an('object')
    })

    describe('generated XML', function () {
      let obj

      beforeEach(async function () {
        const result = await xml2js.parseStringPromise('<wrapper>' + invoice._generateXML() + '</wrapper>')

        obj = result.wrapper
      })

      it('should have `fejlec` node', function () {
        expect(obj).to.have.property('fejlec')
      })

      it('should have `elado` node', function () {
        expect(obj).to.have.property('elado')
      })

      it('should have `vevo` node', function () {
        expect(obj).to.have.property('vevo')
      })

      it('should have `tetelek` node', function () {
        expect(obj).to.have.property('tetelek')
      })

      // START- New test suite for adjustmentInvoiceNumber property
      describe('adjustmentInvoiceNumber validation', function () {
        it('should not include adjustmentInvoiceNumber when it is null', async function () {
          const invoice = new Invoice({
            adjustmentInvoiceNumber: null,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          const result = await xml2js.parseStringPromise('<wrapper>' + invoice._generateXML() + '</wrapper>')

          expect(result.wrapper).to.not.have.deep.property('fejlec.helyesbitettSzamlaszam');
          expect(result.wrapper).to.not.have.deep.property('fejlec.helyesbitoszamla');
        });

        it('should not include adjustmentInvoiceNumber when it is undefined', async function () {
          const invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          const result = await xml2js.parseStringPromise('<wrapper>' + invoice._generateXML() + '</wrapper>')

          expect(result.wrapper).to.not.have.deep.property('fejlec.helyesbitettSzamlaszam');
          expect(result.wrapper).to.not.have.deep.property('fejlec.helyesbitoszamla');
        });

        it('should throw an error when adjustmentInvoiceNumber is an empty string', function () {
          expect(() => {
            invoice = new Invoice({
              adjustmentInvoiceNumber: '',
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
            });
            invoice._generateXML();
          }).to.throw(/"adjustmentInvoiceNumber" should be minimum 1 character/);
        });

        it('should throw an error when adjustmentInvoiceNumber is a Date object', function () {

          expect(() => {
            invoice = new Invoice({
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
              adjustmentInvoiceNumber: new Date()
            });
            invoice._generateXML();
          }).to.throw(/"adjustmentInvoiceNumber" should be a string/);
        });

        it('should throw an error when adjustmentInvoiceNumber is a number', function () {
          invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
            adjustmentInvoiceNumber: 123
          });
          expect(() => {
            invoice._generateXML();
          }).to.throw(/"adjustmentInvoiceNumber" should be a string/);
        });

        it('should throw an error when adjustmentInvoiceNumber is a boolean', function () {
          const invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
            adjustmentInvoiceNumber: true
          });
          expect(() => {
            invoice._generateXML();
          }).to.throw(/"adjustmentInvoiceNumber" should be a string/);
        });

        it('should not throw an error when adjustmentInvoiceNumber is a non-empty string', function () {
          expect(() => {
            const invoice = new Invoice({
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
              adjustmentInvoiceNumber: '12345'
            });
            invoice._generateXML();
          }).to.not.throw();
        });

        it('should include adjustmentInvoiceNumber when it is a non-empty string', async function () {
          const invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
            adjustmentInvoiceNumber: '12345'
          });
          const result = await xml2js.parseStringPromise('<wrapper>' + invoice._generateXML() + '</wrapper>')

          expect(result.wrapper.fejlec[0].helyesbitettSzamlaszam[0]).to.equal('12345');
          expect(result.wrapper.fejlec[0].helyesbitoszamla[0]).to.equal('true');
        });
      });
      // END - New test suite for adjustmentInvoiceNumber property

      describe('NAV reporting', function () {
        it('should not include noNavReport when it is null.', async function () {
          const invoice = new Invoice({
            noNavReport: null,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          const result = await xml2js.parseStringPromise('<wrapper>' + invoice._generateXML() + '</wrapper>')

          expect(result.wrapper).to.not.have.deep.property('fejlec.eusAfa');
        });

        it('should not include noNavReport when it is undefined.', async function () {
          const invoice = new Invoice({
            noNavReport: undefined,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          const result = await xml2js.parseStringPromise('<wrapper>' + invoice._generateXML() + '</wrapper>')

          expect(result.wrapper).to.not.have.deep.property('fejlec.eusAfa');
        });

        it('should set eusAfa to true when noNavReport = true', async function () {
          const invoice = new Invoice({
            noNavReport: true,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          const result = await xml2js.parseStringPromise('<wrapper>' + invoice._generateXML() + '</wrapper>')

          // it returns with string true because the xml parser parse it as string
          expect(result.wrapper.fejlec[0].eusAfa).to.deep.equal(['true']);
        });

        it('should set eusAfa to false when noNavReport = false', async function () {
          const invoice = new Invoice({
            noNavReport: false,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          const result = await xml2js.parseStringPromise('<wrapper>' + invoice._generateXML() + '</wrapper>')

          // it returns with string true because the xml parser parse it as string
          expect(result.wrapper.fejlec[0].eusAfa).to.deep.equal(['false']);
        });
      })
    });
  });
});
