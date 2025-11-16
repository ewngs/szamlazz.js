import merge from 'merge';
import { wrapWithElement } from './XMLUtils';

// Interface for bank details
interface Bank {
  name?: string;
  accountNumber?: string;
}

// Interface for email details
interface Email {
  replyToAddress?: string;
  subject?: string;
  message?: string;
}

// Interface for Seller options
interface SellerOptions {
  bank?: Bank;
  email?: Email;
  issuerName?: string;
}

// Default options with type annotation
const defaultOptions: SellerOptions = {
  bank: {},
  email: {},
};

export class Seller {
  private _options: SellerOptions;

  constructor(options: Partial<SellerOptions> = {}) {
    this._options = merge.recursive(true, defaultOptions, options) as SellerOptions;
  }

  _generateXML(indentLevel: number = 0): string {
    return wrapWithElement('elado', [
      ['bank', this._options.bank?.name],
      ['bankszamlaszam', this._options.bank?.accountNumber],
      ['emailReplyto', this._options.email?.replyToAddress],
      ['emailTargy', this._options.email?.subject],
      ['emailSzoveg', this._options.email?.message],
      ['alairoNeve', this._options.issuerName],
    ], indentLevel);
  }
}

// Type declarations for imported modules (minimal assumptions)
declare module './XMLUtils' {
  export function wrapWithElement(tag: string, elements: [string, any][], indentLevel: number): string;
}