//suspense-like async resource helper
const resourceCache = (window.__reactliteCache = window.__reactliteCache || {}); //store resolved values
const inFlight = {}; //track ongoing promises by key

export function createResource(task, key) {
  //return cached value if available
  if (key in resourceCache) return resourceCache[key];

  //if not already loading, start task
  if (!inFlight[key]) inFlight[key] = startTaskOnce(task, key);

  //throw promise so calling component can suspend until resolved
  throw { promise: inFlight[key], key };
}

function startTaskOnce(task, key) {
  //run async task once, store result, and rerender when done
  return task().then((value) => {
    resourceCache[key] = value; //cache value
    delete inFlight[key]; //remove from pending
    if (window.reactliteReRender) window.reactliteReRender(); //trigger rerender
    return value; //pass resolved value forward
  });
}
