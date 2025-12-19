let currentFiber = null;

export function prepareHooks(fiber) {
  currentFiber = fiber; //point global to the fiber being rendered
  fiber.__hookIndex = 0; //reset hook cursor
  fiber._workingHooks = []; //collect hooks for this render
}

export function useState(initial) {
  const fiber = currentFiber; //the fiber currently rendering
  const index = fiber.__hookIndex || 0; //which hook slot we’re on

  const prev = readPreviousHook(fiber, index); //read prior committed hook if any

  //build working hook from previous state/queue or initial
  const hook = {
    state: prev ? prev.state : initial,
    queue: prev ? prev.queue || [] : [],
  };

  applyQueuedActions(hook); //apply queued updates from last pass

  //setter schedules an update at this hook index and triggers rerender
  const setState = (action) => {
    enqueueUpdate(fiber, index, action);
    if (window.reactliteReRender) window.reactliteReRender();
  };

  fiber._workingHooks.push(hook); //stash for commit
  fiber.__hookIndex = index + 1; //advance cursor

  return [hook.state, setState];
}

function readPreviousHook(fiber, index) {
  //grab the previously committed hooks array and return slot by index
  const prevList = fiber.alternate?.memoizedState;
  return prevList ? prevList[index] : null;
}

function applyQueuedActions(hook) {
  //each action can be a value or updater function (prev => next)
  for (let i = 0; i < hook.queue.length; i++) {
    const action = hook.queue[i];
    hook.state = typeof action === "function" ? action(hook.state) : action;
  }
  hook.queue = []; //clear after applying
}

function enqueueUpdate(fiber, index, action) {
  //ensure per-hook queue and append action
  const q = fiber.updateQueue || (fiber.updateQueue = []);
  q[index] = q[index] || [];
  q[index].push(action);
}
