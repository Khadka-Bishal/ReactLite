const TEXT_ELEMENT_TYPE = "TEXT_ELEMENT";

export function createTextNode(text) {
  return {
    type: TEXT_ELEMENT_TYPE,
    props: { nodeValue: String(text), children: [] },
  };
}

function isBlankString(value) {
  //check if string trims to empty
  return typeof value === "string" && value.trim && value.trim() === "";
}

function shouldRenderChild(c) {
  //skip null, undefined, false, or blank strings
  return c != null && c !== false && !isBlankString(c);
}

export const ReactLite = {
  createElement(type, props, ...children) {
    //remove invalid children and wrap non-objects as text nodes
    const cleaned = children
      .flat(2)
      .filter(shouldRenderChild)
      .map((c) => (typeof c === "object" ? c : createTextNode(String(c))));

    //combine given props with processed children
    const mergedProps = { ...(props || {}), children: cleaned };

    //return vnode
    return { type, props: mergedProps };
  },
};
