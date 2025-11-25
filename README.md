# ReactLite

this is my tiny “react-ish” renderer that I wrote to learn how React works under the hood.

mainly me learning fiber, hooks, lazy resources, scheduling, diffing, etc.

I basically built a very small react-like engine:

- fiber tree
- incremental work loop (requestIdleCallback polyfill)
- diffing children (reconciliation)
- commit phase (dom patching)
- useState (no effects)
- suspense-style async resource (throw promise)

---

## why I built this

react feels magical if you only ever use it.  
I wanted to remove the fog and literally learn the mechanics.

---

## demo

I made a small music–player UI by using this new react-ish framework to see that the rendering, state, and async behavior works as expected. 

🎧  [**Demo:**](https://khadka-bishal.github.io/ReactLite/) https://khadka-bishal.github.io/ReactLite/ 

<img width="960" height="503" alt="image" src="https://github.com/user-attachments/assets/fc6c1f3c-e588-4f9d-b474-a8f6ca3075e6" />


---

## features

| feature | supported |
| --- | :---: |
| function components | ✅ |
| useState | ✅ |
| async resource (simple suspense) | ✅ |
| diff children + reconcile | ✅ |
| fiber work loop (yielding) | ✅ |


