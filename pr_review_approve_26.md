The ragdoll crash animation looks fantastic! It adds much-needed "juice" to the game and makes failing a trick a bit more fun visually. The separation of `CrashState` and the new rendering files keeps `Engine.ts` very clean.

I've reviewed the implementation and everything looks rock solid. The screen shake math with exponential decay is a great touch, and fading out via `globalAlpha` works perfectly.

A few minor notes (no changes strictly required, just things to keep in mind):
1. **Frame-rate Dependent Friction**: In `updateCrash()`, doing `cs.riderVX *= friction` and `cs.riderVX *= 0.7` inside the update loop makes the friction slightly frame-rate dependent since it runs every frame rather than scaling by `dt` (e.g. `cs.riderVX *= Math.pow(friction, dt)`). For a purely visual 1.2s crash effect, this perfectly acceptable and won't cause any gameplay desyncs, but worth noting for core physics!
2. **Obstacle Collision during Crash**: The tumbling rider and bike will fall through raised obstacles (like shipping containers) and only bounce once they hit the core `groundY`. This is actually standard practice for 2D arcade games (it prevents the ragdoll from getting weirdly stuck on geometry) and feels very natural here. 

Excellent work! Approving.
