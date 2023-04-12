import xml2js from 'xml2js'

const padStr = '  '

export function pad (num, str) {
  str = str || padStr

  let o = ''

  if (num > 0) {
    for (let i = 0; i < num; i++) {
      o = o + str
    }
  }

  return o
}

const xmlSubstChars = { '<': '&lt;', '>': '&gt;', '&': '&amp;' }
const xmlSubstRegexp = /[<>&]/g
const replaceXMLChar = chr => xmlSubstChars[ chr ]

function escapeXMLString (str) {
  return str.replace(xmlSubstRegexp, replaceXMLChar)
}

export function wrapWithElement (name, data, indentLevel) {
  indentLevel = indentLevel || Number(data) || 0

  if (Array.isArray(name)) {
    return name.map(item => wrapWithElement(item[ 0 ], item[ 1 ], indentLevel + 1)).join('')
  }

  let o = ''

  if (typeof data !== 'undefined' && data !== null) {
    o = pad(indentLevel) + '<' + name + '>'

    if (Array.isArray(data)) {
      o += '\n' + wrapWithElement(data, indentLevel) + pad(indentLevel, '  ')
    } else {
      if (data instanceof Date) {
        let y = data.getFullYear()
        let m = data.getMonth() + 1
        let d = data.getDate()

        m = m < 10 ? '0' + m : m
        d = d < 10 ? '0' + d : d
        o += y + '-' + m + '-' + d
      } else {
        o += escapeXMLString(String(data))
      }
    }

    o += '</' + name + '>\n'
  }

  return o
}

export function parseString(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

export async function xml2obj(xml, objList) {
  const res = await parseString(xml)
  const hash = {}
  Object.keys(objList).forEach(keyPath => {
    const path = keyPath.split('.')

    let found = true
    let p = res

    for (let i = 0; i < path.length; i++) {
      if (Object.hasOwnProperty.bind(p)(path[ i ])) {
        p = p[ path[ i ] ]
      } else {
        found = false
        break
      }
    }

    if (found) {
      hash[ objList[ keyPath ] ] = p[ 0 ]
    }
  })

  return hash
}
