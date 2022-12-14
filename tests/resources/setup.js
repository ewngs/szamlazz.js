import { join } from 'desm'

import {Currency, Language, PaymentMethod, TaxSubjects} from "../../lib/Constants.js"

export const RESPONSE_FILE_PATHS = Object.freeze({
  SUCCESS_WITH_PDF: join(import.meta.url, 'success_with_pdf.xml'),
  SUCCESS_WITHOUT_PDF: join(import.meta.url, 'success_without_pdf.xml'),
  UNKNOWN_INVOICE_NUMBER: join(import.meta.url, 'unknown_invoice_number.xml')
})

/**
 * Create client
 * @return {Client}
 */
export function createClient(Client) {
  return new Client({
    user: 'USERNAME',
    password: 'PASSWORD',
    eInvoice: false,
    requestInvoiceDownload: true,
    downloadedInvoiceCount: 0,
    responseVersion: 1
  })
}

export function createTokenClient(Client) {
  return new Client({
    authToken: 'AUTHTOKEN',
    eInvoice: false,
    requestInvoiceDownload: true,
    downloadedInvoiceCount: 0,
    responseVersion: 1
  })
}
/**
 * Create seller
 * Optional and can be used to override the default data.
 * @return {Seller}
 */
export function createSeller(Seller) {
  return new Seller({
    bank: {
      name: 'Test Bank <name>',
      accountNumber: '11111111-11111111-11111111'
    },
    email: {
      replyToAddress: 'test@email.com',
      subject: 'Invocie email subject',
      message: 'This is an email message'
    },
    issuerName: ''
  })
}

/**
 * Create Buyer
 * Required, you should supply basic data: name, zip, city, address as a minimum. Hungary is the default country.
 * @return {Buyer}
 */
export function createBuyer(Buyer) {
  return new Buyer({
    name: 'Test ' + Math.random(),
    country: '',
    zip: '1234',
    city: 'City',
    address: 'Some street address',
    taxNumber: '12345678-1-42',
    postAddress: {
      name: 'Some Buyer Name',
      zip: '1234',
      city: 'City',
      address: 'Some street address'
    },
    taxSubject: TaxSubjects.Unknown,
    issuerName: '',
    identifier: 1,
    phone: '',
    comment: ''
  })
}

/**
 * Create sold item with net price
 * @return {Item}
 */
export function createSoldItemNet(Item) {
  return new Item({
    label: 'First item',
    quantity: 2,
    unit: 'qt',
    vat: 27, // can be a number or a special string
    netUnitPrice: 100.55, // calculates gross and net values from per item net
    comment: 'An item'
  })
}

/**
 * Create sold item with gross price
 * @return {Item}
 */
export function createSoldItemGross(Item) {
  return new Item({
    label: 'Second item',
    quantity: 5,
    unit: 'qt',
    vat: 27,
    grossUnitPrice: 1270 // calculates net and total values from per item gross
  })
}

/**
 * Create invoice
 * Buyer and seller can be shared between invoices.
 * @return {Invoice}
 */
export function createInvoice(Invoice, seller, buyer, items) {
  return new Invoice({
    paymentMethod: PaymentMethod.BankTransfer,
    currency: Currency.Ft,
    language: Language.Hungarian,
    seller: seller,
    buyer: buyer,
    items
  })
}
