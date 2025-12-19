export function normalizePropName(name) {
  //convert common react-style event props to lowercase dom ones
  if (name === "onClick") return "onclick";
  if (name === "onChange") return "onchange";
  return name;
}

function idleFallback(callback) {
  //fake requestidlecallback using settimeout for environments that lack it
  return setTimeout(() => callback({ timeRemaining: () => 0 }), 1);
}

//use browser requestidlecallback if available, else fallback
export const ric = window.requestIdleCallback || idleFallback;
