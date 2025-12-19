import { commitRoot } from "./commit.js";
import { ric, normalizePropName } from "./utils.js";
import { prepareHooks } from "./hooks.js";

export function renderFiber(element, container) {
  //reset all global states before new render
  deletions = [];
  wipRoot = {
    type: container.nodeName.toLowerCase(), //root type matches container tag
    props: { children: [element] }, //wrap element as root child
    dom: container,
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot, //link to previous fiber tree
  };
  nextUnitOfWork = wipRoot; //set as first task for the work loop
}

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = [];

function createDom(fiber) {
  //create text or element node
  if (fiber.type === "TEXT_ELEMENT") {
    return document.createTextNode(fiber.props.nodeValue);
  }
  const dom = document.createElement(fiber.type);
  if (fiber.props) applyInitialProps(dom, fiber.props);
  return dom;
}

function applyInitialProps(dom, props) {
  //assign props to dom node except children
  for (const key of Object.keys(props)) {
    if (key === "children") continue;
    const nk = normalizePropName(key);
    dom[nk] = props[key];
  }
}

function reconcileChildren(fiber, elements) {
  //compare new children with old ones and create/update/delete fibers
  const children = elements || [];
  let oldChild = fiber.alternate && fiber.alternate.child;
  let prevSibling = null;

  for (let i = 0; i < children.length || oldChild; i++) {
    const newEl = i < children.length ? children[i] : null;
    const sameType = oldChild && newEl && oldChild.type === newEl.type;
    let newFiber = null;

    if (sameType) {
      newFiber = createUpdateFiber(fiber, oldChild, newEl); //reuse dom
    } else if (newEl) {
      newFiber = createPlacementFiber(fiber, newEl); //create new dom
    }

    if (!sameType && oldChild) deletions.push(oldChild); //mark old for removal
    linkAsChildOrSibling(fiber, prevSibling, newFiber, i); //link fibers

    prevSibling = newFiber || prevSibling;
    oldChild = oldChild ? oldChild.sibling : null;
  }
}

function createUpdateFiber(parent, oldChild, newEl) {
  //reuse dom and keep link to old
  return {
    type: oldChild.type,
    props: newEl.props,
    parent,
    dom: oldChild.dom,
    alternate: oldChild,
    child: null,
    sibling: null,
  };
}

function createPlacementFiber(parent, newEl) {
  //create new dom for new element
  return {
    type: newEl.type,
    props: newEl.props,
    parent,
    dom: null,
    alternate: null,
    child: null,
    sibling: null,
  };
}

function linkAsChildOrSibling(parent, prevSibling, newFiber, index) {
  //attach first child or connect siblings
  if (newFiber) {
    if (index === 0) parent.child = newFiber;
    else prevSibling.sibling = newFiber;
  } else if (index === 0) {
    parent.child = null;
  }
}

export function performUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";
  if (isFunctionComponent) updateFunctionComponent(fiber);
  else updateHostComponent(fiber);
  return getNextUnit(fiber); //return next work item
}

function updateFunctionComponent(fiber) {
  prepareHooks(fiber); //setup hooks for this render
  replayQueuedUpdatesFromAlternate(fiber); //restore queued state updates

  //run user component; catch async resource throws
  const childElement = runComponentWithCatch(fiber);

  //reconcile returned element and store hooks for later
  reconcileChildren(fiber, [childElement]);
  fiber.memoizedState = fiber._workingHooks;
}

function replayQueuedUpdatesFromAlternate(fiber) {
  //transfer pending updates from previous committed fiber
  const alt = fiber.alternate;
  if (!alt || !alt.updateQueue) return;
  alt.updateQueue.forEach((q, i) => {
    if (!q) return;
    const oldHook = alt.memoizedState && alt.memoizedState[i];
    if (oldHook) oldHook.queue = (oldHook.queue || []).concat(q);
  });
  alt.updateQueue = null;
}

function runComponentWithCatch(fiber) {
  //run component, show fallback if promise thrown
  try {
    return fiber.type(fiber.props || {});
  } catch (thrown) {
    const { promise } = thrown || {};
    if (promise && typeof promise.then === "function") {
      promise.then(
        () => window.reactliteReRender && window.reactliteReRender()
      );
    }
    //fallback element while waiting for async resource
    return {
      type: "h2",
      props: {
        children: [
          {
            type: "TEXT_ELEMENT",
            props: { nodeValue: "resource loading", children: [] },
          },
        ],
      },
    };
  }
}

function updateHostComponent(fiber) {
  //ensure dom exists and reconcile children
  if (!fiber.dom) fiber.dom = createDom(fiber);
  const kids = (fiber.props && fiber.props.children) || [];
  reconcileChildren(fiber, kids);
}

//dfs child→sibling→uncle)
function getNextUnit(fiber) {
  //depth-first walk to find next fiber
  if (fiber.child) return fiber.child;
  let next = fiber;
  while (next) {
    if (next.sibling) return next.sibling;
    next = next.parent;
  }
  return null;
}

export function workLoop(deadline) {
  //perform work until we run out of idle time
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; //yield if short on time
  }

  //if work finished and root exists, commit all changes
  if (!nextUnitOfWork && wipRoot) {
    commitRoot(
      wipRoot,
      deletions,
      (root) => (currentRoot = root),
      () => (wipRoot = null)
    );
  }

  ric(workLoop); //schedule next frame
}
ric(workLoop);
