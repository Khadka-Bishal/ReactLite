# ReactLite

this is my tiny “react-ish” renderer that I wrote to learn how React works under the hood.

**not production, not a library, not trying to compete with react**  
this is mainly me learning fiber, hooks, lazy resources, scheduling, diffing, etc.

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

i made a small music–player UI to show the scheduler/fiber work loop in action.

🎧  [**Demo:**](https://khadka-bishal.github.io/ReactLite/): https://khadka-bishal.github.io/ReactLite/ 

<img width="921" height="461" alt="image" src="https://github.com/user-attachments/assets/07a9c00b-5233-412d-aad0-f8c8b76b50b1" />

---

## features

| feature | supported |
| --- | :---: |
| function components | ✅ |
| useState | ✅ |
| async resource (simple suspense) | ✅ |
| diff children + reconcile | ✅ |
| fiber work loop (yielding) | ✅ |


