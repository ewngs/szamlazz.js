# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

## [4.2.0] - 2021-06-22

- Add tax subject (adóalany).

## [4.1.0] - 2020-05-16

- Add "ÁKK" VAT option.

## [4.0.0] - 2020-04-04

- Extract and return response headers in Client.reverseInvoice()
- Return PDF content if available in reverseInvoice()
- Add new option to generate prepayment invoices.

## [3.0.0] - 2020-02-25

- Replace mistyped passpharase with passphrase.

## [2.0.0] - 2019-12-21

- Clone invoice options, which makes default invoice options not get overwritten by new invoice options. This bug resulted in old invoice dates.
- Don't force a non-empty ZIP code, because there are countries for which it's not mandatory, Vietnam surely included.
- Rename the invoiceNumber option of Client.getInvoiceData() to invoiceId for the sake of consistency.
- Use auth token instead of user/password as szamlazz.hu encourages to use "Számla Agent" keys, which are basically auth tokens.
- Add logoExtra element as szamlazz.hu API can pick from several logos for the invoices.
- Save Invoice._options.comment
- Add Client.getInvoiceData()
- Add Client.reverseInvoice()
- Add new payment method for PayPal.
- Add CONTRIBUTING.md
- Remove JavaScript standard style check.
- Remove ES5 version.

## [1.0.9] - 2019-01-11

- Allow for empty string Item.unit values.
- Expose Invoice.{exchangeRate,exchangeBank}
- Add ['TAM', 'AAM', 'EU', 'EUK', 'MAA'] VAT key support.
- Extend and reorganize unit tests.
- Recompile ES5 version.

## [1.0.8] - 2016-07-22

- Call error callback upon HTTP errors.
- Add unit tests.
- Remove unneeded files and dependencies.
- Add JavaScript standard style check.
- Improve Readme.
- Recompile ES5 version.

## [1.0.7] - 2016-07-14

- Add unit tests.
- Refactor Client.
- Recompile ES5 version.

## [1.0.6] - 2016-07-11

- Add missing dependency.
- Refactor Buyer.
- Apply JavaScript standard style.
- Improve documentation.
- Recompile ES5 version.

## [1.0.5] - 2016-03-11

- Accept negative amount for invoice items.

## [1.0.4] - 2016-03-10

- Recompile ES5 version.

## [1.0.3] - 2016-03-10

- Fix date conversion.

## [1.0.2] - 2016-03-09

- Remove a leftover loging line.
- Fix documentation comment.

## [1.0.1] - 2016-03-08

- Fix loading error.

## [1.0.0] - 2016-03-02

- Publish first release.
