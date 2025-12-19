import { normalizePropName } from "./utils.js";

export function commitRoot(root, deletions, setCurrentRoot, clearWip) {
  deletions.forEach(removeFiber); //remove all scheduled deletions from the dom
  commitFiber(root.child); //start committing from first child of the root
  setCurrentRoot(root); //remember the last committed tree
  clearWip(); //clear work-in-progress pointer
}

function removeFiber(fiber) {
  if (!fiber) return;

  if (fiber.dom && fiber.dom.parentNode) {
    fiber.dom.parentNode.removeChild(fiber.dom); //detach host node
  } else {
    removeFiber(fiber.child); //no host node here, delete deeper first
  }

  removeFiber(fiber.sibling); //continue across siblings
}

export function commitFiber(fiber) {
  if (!fiber) return;

  const parentDom = findHostParent(fiber); //walk up to nearest ancestor with a dom node

  //safety guard for unexpected missing parentDom when a parent fiber exists
  if (!parentDom && fiber.parent) {
    commitFiber(fiber.child);
    commitFiber(fiber.sibling);
    return;
  }

  //stash props that actually made it to the dom so next render can diff against them
  fiber.memoizedProps = fiber.props;

  //text node updates are just nodeValue changes plus ensuring correct placement
  if (fiber.type === "TEXT_ELEMENT" && fiber.dom) {
    const prevText = fiber.alternate?.props?.nodeValue;
    const nextText = fiber.props?.nodeValue;
    if (prevText !== nextText) {
      fiber.dom.nodeValue = String(nextText ?? ""); //normalize to string
    }
    if (fiber.dom.parentNode !== parentDom) {
      parentDom?.appendChild(fiber.dom); //attach text node if not already placed
    }
    commitFiber(fiber.child); //text nodes can still have a child in our model
    commitFiber(fiber.sibling);
    return;
  }

  //prop diff for reused host nodes (same dom reused from alternate)
  if (fiber.dom && fiber.alternate && fiber.alternate.dom === fiber.dom) {
    const prevProps = fiber.alternate.props || {};
    const nextProps = fiber.props || {};
    removeOldProps(fiber.dom, prevProps, nextProps); //drop props that disappeared
    setNewOrChangedProps(fiber.dom, prevProps, nextProps); //apply new or changed props
  }

  //ensure placement for new or moved host nodes
  if (fiber.dom && fiber.dom.parentNode !== parentDom) {
    parentDom?.appendChild(fiber.dom); //append into correct parent
  }

  //depth-first commit: child first, then sibling
  commitFiber(fiber.child);
  commitFiber(fiber.sibling);
}

function findHostParent(fiber) {
  //walk up until we find a fiber that actually owns a dom node
  let p = fiber.parent;
  while (p && !p.dom) p = p.parent;
  return p?.dom ?? null; //null at the very top
}

function removeOldProps(dom, prevProps, nextProps) {
  //remove anything that was present but is no longer in nextProps
  for (const key of Object.keys(prevProps)) {
    if (key === "children") continue;
    if (key in nextProps) continue;

    const norm = normalizePropName(key); //normalize event names etc
    if (norm.startsWith("on")) {
      dom[norm] = null; //detach event handler
    } else if (norm in dom) {
      dom[norm] = ""; //clear known property on the element
    } else {
      dom.removeAttribute?.(norm); //fallback to attribute removal
    }
  }
}

function setNewOrChangedProps(dom, prevProps, nextProps) {
  //apply props that are new or changed compared to prevProps
  for (const key of Object.keys(nextProps)) {
    if (key === "children") continue;

    const prevVal = prevProps[key];
    const nextVal = nextProps[key];
    if (prevVal === nextVal) continue; //skip unchanged

    const norm = normalizePropName(key); //normalize property/handler name
    if (norm.startsWith("on")) {
      dom[norm] = nextVal || null; //set or clear event handler
    } else if (norm in dom) {
      dom[norm] = nextVal ?? ""; //set as a property if supported by the element
    } else {
      dom.setAttribute?.(norm, nextVal); //fallback to attribute
    }
  }
}
