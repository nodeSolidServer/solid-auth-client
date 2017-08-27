// from http://2ality.com/2015/01/template-strings-html.html
export const html = (literals, ...substs) =>
  literals.raw.reduce((acc, lit, i) => {
    let subst = substs[i - 1]
    if (Array.isArray(subst)) {
      subst = subst.join('')
    }
    if (acc.endsWith('$')) {
      subst = htmlEscape(subst)
      acc = acc.slice(0, -1)
    }
    return acc + subst + lit
  })

// from http://2ality.com/2015/01/template-strings-html.html
const htmlEscape = str =>
  str
    .replace(/&/g, '&amp;') // first!
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')

export const render = (htmlStr, selectorOrElement) => {
  if (typeof selectorOrElement === 'string') {
    const container = document.querySelector(selectorOrElement)
    container.innerHTML = htmlStr
  } else if (selectorOrElement instanceof Element) {
    selectorOrElement.innerHTML = htmlStr
  } else {
    throw new Error(
      `Could not render -- selectorOrElement neither a CSS selector nor an Element`
    )
  }
}
