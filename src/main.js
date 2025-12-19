import { ReactLite } from "./reactlite/element.js";
import App from "./App.js";
import { renderFiber } from "./reactlite/fiber.js";

//expose a global re-render entry used by hooks/resource
window.reactliteReRender = () => {
  const root = document.getElementById("reactlite-app");
  if (root) renderFiber(<App />, root);
};

//initial render
const root = document.getElementById("reactlite-app");
if (root) renderFiber(<App />, root);
