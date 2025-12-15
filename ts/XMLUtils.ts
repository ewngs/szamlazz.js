import xml2js from 'xml2js';

const padStr = '  ';

export function pad(num: number, str: string = padStr): string {
  let o = '';

  if (num > 0) {
    for (let i = 0; i < num; i++) {
      o += str;
    }
  }

  return o;
}

const xmlSubstChars: { [key: string]: string } = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };
const xmlSubstRegexp = /[<>&]/g;
const replaceXMLChar = (chr: string): string => xmlSubstChars[chr];

function escapeXMLString(str: string): string {
  return str.replace(xmlSubstRegexp, replaceXMLChar);
}

export function wrapWithElement(name: string | [string, any][], data?: any, indentLevel: number = 0): string {
  indentLevel = indentLevel || (typeof data === 'number' ? data : 0);

  if (Array.isArray(name)) {
    return name.map(item => wrapWithElement(item[0], item[1], indentLevel + 1)).join('');
  }

  let o = '';

  if (typeof data !== 'undefined' && data !== null) {
    o = pad(indentLevel) + '<' + name + '>';

    if (Array.isArray(data)) {
      o += '\n' + wrapWithElement(data, indentLevel) + pad(indentLevel);
    } else {
      if (data instanceof Date) {
        const y = data.getFullYear();
        let m: number | string = data.getMonth() + 1;
        let d: number | string = data.getDate();

        m = m < 10 ? '0' + m : m;
        d = d < 10 ? '0' + d : d;
        o += `${y}-${m}-${d}`;
      } else {
        o += escapeXMLString(String(data));
      }
    }

    o += '</' + name + '>\n';
  }

  return o;
}

export async function xml2obj(xml: string, objList: { [key: string]: string }): Promise<{ [key: string]: any }> {
  const res = await xml2js.parseStringPromise(xml);
  const hash: { [key: string]: any } = {};
  Object.keys(objList).forEach(keyPath => {
    const path = keyPath.split('.');

    let found = true;
    let p: any = res;

    for (let i = 0; i < path.length; i++) {
      if (Object.prototype.hasOwnProperty.call(p, path[i])) {
        p = p[path[i]];
      } else {
        found = false;
        break;
      }
    }

    if (found) {
      hash[objList[keyPath]] = p[0];
    }
  });

  return hash;
}