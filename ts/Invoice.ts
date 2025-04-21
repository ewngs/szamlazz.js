import assert from 'assert';
import { Currencies, Currency, Language, Languages, PaymentMethod, PaymentMethods } from './Constants';
import { pad, wrapWithElement } from './XMLUtils';
import { Seller } from './Seller';
import { Buyer } from './Buyer';
import { Item } from './Item';

// Interface for Invoice options
interface InvoiceOptions {
  issueDate?: Date;
  fulfillmentDate?: Date;
  dueDate?: Date;
  paymentMethod?: PaymentMethod;
  currency?: Currency;
  language?: Language;
  exchangeRate?: number;
  exchangeBank?: string;
  seller?: Seller;
  buyer: Buyer;
  items: Item[];
  orderNumber?: string;
  noNavReport?: boolean;
  proforma?: boolean;
  invoiceIdPrefix?: string;
  paid?: boolean;
  comment?: string;
  logoImage?: string;
  adjustmentInvoiceNumber?: string;
  prepaymentInvoice?: boolean;
  adjustmentInvoice?: boolean;
}

// Default options with type annotation
const defaultOptions: Partial<InvoiceOptions> = {
  paymentMethod: PaymentMethods.BankTransfer,
  currency: Currencies.Ft,
  language: Languages.Hungarian,
  exchangeRate: 0,
  exchangeBank: '',
};

export class Invoice {
  private _options: InvoiceOptions;

  constructor(options: Partial<InvoiceOptions>) {
    this._options = {
      issueDate: options.issueDate || new Date(),
      fulfillmentDate: options.fulfillmentDate || new Date(),
      dueDate: options.dueDate || new Date(),
      paymentMethod: options.paymentMethod || defaultOptions.paymentMethod!,
      currency: options.currency || defaultOptions.currency!,
      language: options.language || defaultOptions.language!,
      exchangeRate: options.exchangeRate || defaultOptions.exchangeRate!,
      exchangeBank: options.exchangeBank || defaultOptions.exchangeBank!,
      seller: options.seller,
      buyer: options.buyer!,
      items: options.items!,
      orderNumber: options.orderNumber,
      noNavReport: options.noNavReport,
      proforma: options.proforma,
      invoiceIdPrefix: options.invoiceIdPrefix,
      paid: options.paid,
      comment: options.comment,
      logoImage: options.logoImage,
      adjustmentInvoiceNumber: options.adjustmentInvoiceNumber,
      prepaymentInvoice: options.prepaymentInvoice || false,
    };

    // Ensure required fields are provided
    assert(this._options.buyer, 'Buyer is required in invoice options');
    assert(this._options.items, 'Items array is required in invoice options');
  }

  _generateXML(indentLevel: number = 0): string {
    assert(this._options.issueDate instanceof Date,
      'Valid IssueDate field missing from invoice options');

    assert(this._options.fulfillmentDate instanceof Date,
      'Valid FulfillmentDate field missing from invoice options');

    assert(this._options.dueDate instanceof Date,
      'Valid DueDate field missing from invoice options');

    assert(this._options.paymentMethod instanceof PaymentMethod,
      'Valid PaymentMethod field missing from invoice options');

    assert(this._options.currency instanceof Currency,
      'Valid Currency field missing from invoice options');

    assert(this._options.language instanceof Language,
      'Valid Language field missing from invoice options');

    assert(typeof this._options.seller === 'undefined' || this._options.seller instanceof Seller,
      'The provided optional Seller field is invalid');

    assert(this._options.buyer instanceof Buyer,
      'Valid Buyer field missing from invoice options');

    assert(Array.isArray(this._options.items),
      'Valid Items array missing from invoice options');

    if (this._options.adjustmentInvoiceNumber !== null && this._options.adjustmentInvoiceNumber !== undefined) {
      assert(typeof this._options.adjustmentInvoiceNumber === 'string', '"adjustmentInvoiceNumber" should be a string');
      assert(this._options.adjustmentInvoiceNumber.length > 0, '"adjustmentInvoiceNumber" should be minimum 1 character');
      this._options.adjustmentInvoice = true;
    }

    let o = wrapWithElement('fejlec', [
      ['keltDatum', this._options.issueDate],
      ['teljesitesDatum', this._options.fulfillmentDate],
      ['fizetesiHataridoDatum', this._options.dueDate],
      ['fizmod', this._options.paymentMethod.value],
      ['penznem', this._options.currency.value],
      ['szamlaNyelve', this._options.language.value],
      ['megjegyzes', this._options.comment],
      ['arfolyamBank', this._options.exchangeBank],
      ['arfolyam', this._options.exchangeRate],
      ['rendelesSzam', this._options.orderNumber],
      ['elolegszamla', this._options.prepaymentInvoice],
      ['helyesbitoszamla', this._options.adjustmentInvoice],
      ['helyesbitettSzamlaszam', this._options.adjustmentInvoiceNumber],
      ['dijbekero', this._options.proforma],
      ['logoExtra', this._options.logoImage],
      ['szamlaszamElotag', this._options.invoiceIdPrefix],
      ['fizetve', this._options.paid],
      ['eusAfa', this._options.noNavReport],
    ], indentLevel);

    if (this._options.seller) {
      o += this._options.seller._generateXML(indentLevel);
    }

    o += this._options.buyer._generateXML(indentLevel);

    o += pad(indentLevel) + '<tetelek>\n';
    o += this._options.items.map(item => {
      assert(item instanceof Item, 'Element in Items array is not an instance of the Item class');
      return item._generateXML(indentLevel, this._options.currency!);
    }).join('');
    o += pad(indentLevel) + '</tetelek>\n';

    return o;
  }
}

// Type declarations for imported modules (minimal assumptions)
declare module './XMLUtils' {
  export function pad(indentLevel: number): string;
  export function wrapWithElement(tag: string, elements: [string, any][], indentLevel: number): string;
}