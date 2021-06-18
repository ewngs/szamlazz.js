# szamlazz.js

A Node.js client for Szamlazz.hu

## Installation

```
npm install szamlazz.js --save
```

## Usage

```javascript
const szamlazz = require('szamlazz.js')
```

### Create a client

```javascript
const szamlazzClient = new szamlazz.Client({
  user: 'USERNAME',
  password: 'PASSWORD',
  eInvoice: false, // create e-invoice. optional, default: false
  passphrase: '', // passphrase for e-invoice. optional
  requestInvoiceDownload: true, // downloads the issued pdf invoice. optional, default: false
  downloadedInvoiceCount: 1, // optional, default: 1
  responseVersion: 1 // optional, default: 1
})
```

Or use "Számla Agent" key to authenticate the client

```javascript
const szamlazzClient = new szamlazz.Client({
  authToken: 'SZAMLAAGENTKEY',
  eInvoice: false, // create e-invoice. optional, default: false
  passphrase: '', // passphrase for e-invoice. optional
  requestInvoiceDownload: true, // downloads the issued pdf invoice. optional, default: false
  downloadedInvoiceCount: 1, // optional, default: 1
  responseVersion: 1 // optional, default: 1
})
```

You can reuse this client to issue invoices.

### Create a seller

```javascript
let seller = new szamlazz.Seller({ // everyting is optional
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
let buyer = new szamlazz.Buyer({
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
let soldItem1 = new szamlazz.Item({
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
let soldItem2 = new szamlazz.Item({
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
let invoice = new szamlazz.Invoice({
  paymentMethod: szamlazz.PaymentMethod.BankTransfer, // optional, default: BankTransfer
  currency: szamlazz.Currency.Ft, // optional, default: Ft
  language: szamlazz.Language.Hungarian, // optional, default: Hungarian
  seller: seller, // the seller, required
  buyer: buyer, // the buyer, required
  items: [ soldItem1, soldItem2 ], // the sold items, required
  prepaymentInvoice: false // prepayment/deposit invoice should be issued, optional, default: false 
})
```

To issue the invoice with szamlazz.hu:

```javascript
try {
  const result = await szamlazzClient.issueInvoice(invoice)
  if (result.pdf) {
    // a Buffer with the pdf data is available if requestInvoiceDownload === true
  }
} catch (e) {
  // Handle error
}

```

### Get invoice data

You can get the data of a previously issued invoice:

```javascript
const szamlazzClient = new szamlazz.Client({
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
const szamlazzClient = new szamlazz.Client({
  user: 'USERNAME',
  password: 'PASSWORD'
})

const invoice = await szamlazzClient.reverseInvoice({
  invoiceId: 'E-RNJLO-2019-1234', // invoice number
  eInvoice: true, // create e-invoice
  requestInvoiceDownload: false, // downloads the issued pdf invoice
})
```

Response
```javascript
{
  invoiceId: 'WXSKA-2020-00', // The id of the created reverse invoice
  netTotal: '1000',           // Total value of the reverse invoice excl. VAT
  grossTotal: '1270'          // Total value of the reverse invoice incl. VAT
  pdf: null                   // the PDF content as string if requestInvoiceDownload was true, otherwise false
}
```

## Constants

### PaymentMethod

The following payment methods are supported by szamlazz.hu:

```
szamlazz.PaymentMethod.Cash
szamlazz.PaymentMethod.BankTransfer
szamlazz.PaymentMethod.CreditCard
szamlazz.PaymentMethod.PayPal
```

### Currency

The following currencies are recognized by szamlazz.hu:

```
szamlazz.Currency.Ft
szamlazz.Currency.HUF
szamlazz.Currency.EUR
szamlazz.Currency.CHF
szamlazz.Currency.USD
szamlazz.Currency.AUD
szamlazz.Currency.AED
szamlazz.Currency.BGN
szamlazz.Currency.CAD
szamlazz.Currency.CNY
szamlazz.Currency.CZK
szamlazz.Currency.DKK
szamlazz.Currency.EEK
szamlazz.Currency.GBP
szamlazz.Currency.HRK
szamlazz.Currency.ISK
szamlazz.Currency.JPY
szamlazz.Currency.LTL
szamlazz.Currency.LVL
szamlazz.Currency.NOK
szamlazz.Currency.NZD
szamlazz.Currency.PLN
szamlazz.Currency.RON
szamlazz.Currency.RUB
szamlazz.Currency.SEK
szamlazz.Currency.SKK
szamlazz.Currency.UAH
```

### Language

The accepted languages are:

```
szamlazz.Currency.Hungarian
szamlazz.Currency.English
szamlazz.Currency.German
szamlazz.Currency.Italian
szamlazz.Currency.Romanian
szamlazz.Currency.Slovak
```
