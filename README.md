# szamlazz.js

A Node.js client for Szamlazz.hu

## Installation

```
npm install szamlazz.js --save
```

## Usage

```javascript
import {
  Buyer,
  Client,
  Invoice,
  Item,
  Seller,
  Currencies,
  Currency,
  Language,
  Languages,
  PaymentMethod,
  PaymentMethods,
  TaxSubject,
  TaxSubjects} from 'szamlazz.js'
```

### Create a client

```javascript
const szamlazzClient = new Client({
  user: 'USERNAME',
  password: 'PASSWORD',
  eInvoice: false, // create e-invoice. optional, default: false
  requestInvoiceDownload: true, // downloads the issued pdf invoice. optional, default: false
  downloadedInvoiceCount: 1, // optional, default: 1
  responseVersion: 1 // optional, default: 1
  timeout: 1000 // optional, default: 0, request timeout in ms (0 = no timeout)
})
```

Or use "Számla Agent" key to authenticate the client

```javascript
const szamlazzClient = new Client({
  authToken: 'SZAMLAAGENTKEY',
  eInvoice: false, // create e-invoice. optional, default: false
  requestInvoiceDownload: true, // downloads the issued pdf invoice. optional, default: false
  downloadedInvoiceCount: 1, // optional, default: 1
  responseVersion: 1 // optional, default: 1
  timeout: 0 // optional, default: 0, request timeout in ms (0 = no timeout)
})
```

You can reuse this client to issue invoices.

### Create a seller

```javascript
let seller = new Seller({ // everyting is optional
  bank: {
    name: 'Test Bank <name>',
    accountNumber: '11111111-11111111-11111111'
  },
  email: {
    replyToAddress: 'test@email.com',
    subject: 'Invoice email subject',
    message: 'This is an email message'
  },
  issuerName: ''
})

```

### Create a buyer

```javascript
let buyer = new Buyer({
  name: 'Some Buyer Name ' + Math.random(),
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
  issuerName: '',
  identifier: 1,
  phone: '',
  comment: ''
})
```

### Create an invoice item

With net unit price:
```javascript
let soldItem1 = new Item({
  label: 'First item',
  quantity: 2,
  unit: 'qt',
  vat: 27, // can be a number or a special string
  netUnitPrice: 100.55, // calculates gross and net values from per item net
  comment: 'Ez egy árvíztűrő tükörfúrógép'
})
```

With gross unit price:

```javascript
let soldItem2 = new Item({
  label: 'Second item',
  quantity: 5,
  unit: 'qt',
  vat: 27,
  grossUnitPrice: 1270 // calculates net and total values from per item gross
})
```

### Create an invoice

You can create an invoice with the instances created above:

```javascript
let invoice = new Invoice({
  paymentMethod: PaymentMethods.BankTransfer, // optional, default: BankTransfer
  currency: Currencies.Ft, // optional, default: Ft
  language: Languages.Hungarian, // optional, default: Hungarian
  seller: seller, // the seller, required
  buyer: buyer, // the buyer, required
  items: [ soldItem1, soldItem2 ], // the sold items, required
  prepaymentInvoice: false // prepayment/deposit invoice should be issued, optional, default: false
})
```

To issue the invoice with szamlazz.hu:

```javascript
const result = await szamlazzClient.issueInvoice(invoice)
if (result.pdf) {
  // a Buffer with the pdf data is available if requestInvoiceDownload === true
}
```

### Get invoice data

You can get the data of a previously issued invoice:

```javascript
const szamlazzClient = new Client({
  user: 'USERNAME',
  password: 'PASSWORD'
})

const invoice = await szamlazzClient.getInvoiceData({
  invoiceId: 'E-RNJLO-2019-1234', // invoice number
  orderNumber: '1234', // order number
  pdf: false // downloads the pdf invoice. optional, default: false
})
```

Either the invoice number or the order number must be specified.

### Reverse invoice

You can reverse a previously issued invoice:

```javascript
const szamlazzClient = new Client({
  user: 'USERNAME',
  password: 'PASSWORD'
})

const invoice = await szamlazzClient.reverseInvoice({
  invoiceId: 'E-RNJLO-2019-1234', // invoice number
  eInvoice: true,                 // create e-invoice
  requestInvoiceDownload: false,  // downloads the issued pdf invoice
})
```

Response
```javascript
{
  invoiceId: 'WXSKA-2020-00', // The id of the created reverse invoice
  netTotal: '1000',           // Total value of the reverse invoice excl. VAT
  grossTotal: '1270'          // Total value of the reverse invoice incl. VAT
  pdf: null                   // the PDF content as a Buffer if requestInvoiceDownload was true, otherwise undefined
}
```

## Constants

### PaymentMethod

The following payment methods are supported by szamlazz.hu:

```
szamlazz.PaymentMethods.Cash
szamlazz.PaymentMethods.BankTransfer
szamlazz.PaymentMethods.CreditCard
szamlazz.PaymentMethods.PayPal
```

### Currencies

The following currencies are recognized by szamlazz.hu:

```
szamlazz.Currencies.Ft
szamlazz.Currencies.HUF
szamlazz.Currencies.EUR
szamlazz.Currencies.CHF
szamlazz.Currencies.USD
szamlazz.Currencies.AUD
szamlazz.Currencies.AED
szamlazz.Currencies.BGN
szamlazz.Currencies.CAD
szamlazz.Currencies.CNY
szamlazz.Currencies.CZK
szamlazz.Currencies.DKK
szamlazz.Currencies.EEK
szamlazz.Currencies.GBP
szamlazz.Currencies.HRK
szamlazz.Currencies.ISK
szamlazz.Currencies.JPY
szamlazz.Currencies.LTL
szamlazz.Currencies.LVL
szamlazz.Currencies.NOK
szamlazz.Currencies.NZD
szamlazz.Currencies.PLN
szamlazz.Currencies.RON
szamlazz.Currencies.RUB
szamlazz.Currencies.SEK
szamlazz.Currencies.SKK
szamlazz.Currencies.UAH
```

### Language

The accepted languages are:

```
szamlazz.Languages.Hungarian
szamlazz.Languages.English
szamlazz.Languages.German
szamlazz.Languages.Italian
szamlazz.Languages.Romanian
szamlazz.Languages.Slovak
```
