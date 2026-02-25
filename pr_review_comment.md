Great work on the PR! The UI implementation and the visual distinction for the sketchy mechanic look solid. The refactoring of the renderer into `game/rendering/*` is excellent and greatly improves the maintainability of the codebase.

However, I've noticed a significant bug with the core math behind the new landing system, particularly around how flip over-rotation and under-rotation are handled.

### 1. Bug in Flip Landing Logic (Handling Over-rotation and Under-rotation):
The current logic for checking flip completions doesn't correctly handle over-rotation or under-rotation for multiple flips, especially in the context of the new "sketchy" or "crash" mechanics.

Currently, `Math.floor(angle / fullFlip)` is used, which means if the player completes 1 flip but lands at 1.5 flips (landing upside down, 540 degrees), `completedFlips` will be `1` and the remainder `180` is completely ignored by the clean logic:
```typescript
const cleanFlips = completedFlips + (remainder >= fullFlip - tolerance ? 1 : 0);
```
Here, `cleanFlips = 1 + 0 = 1`. This will award a *clean single flip* instead of correctly causing a crash, effectively making over-rotation entirely unpenalized and treated as a clean landing.

Similarly, if a player attempts a double flip but lands at 1.875 flips (45 degrees short), `completedFlips` is 1. Since `cleanFlips` will be 1, `flipClean` is true, meaning they get awarded a perfect single flip rather than a sketchy double backflip.

**Suggestion:** Use `Math.round` to find the nearest target flip count, and then check the absolute distance from that target. This gracefully handles both over-rotating and under-rotating for any number of flips:

```typescript
const targetFlips = Math.round(angle / fullFlip);
if (targetFlips >= 1) {
  const diff = Math.abs(angle - targetFlips * fullFlip);
  if (diff <= tolerance) {
    // Clean
    const { label, totalBonus } = computeTrickScore(baseName, BACKFLIP_BONUS, targetFlips);
    return { crashed: false, label, bonus: totalBonus, sketchy: false };
  } else if (diff <= tolerance + sketchyTolerance) {
    // Sketchy
    const { label, totalBonus } = computeTrickScore(baseName, BACKFLIP_BONUS, targetFlips);
    return { crashed: false, label: `Sketchy ${label}`, bonus: Math.round(totalBonus * SKETCHY_PENALTY), sketchy: true };
  }
}
return { crashed: true };
```
You can seamlessly apply this identical logic structure within `evaluateComboLanding` as well to fix the combination logic!

Let me know if you would like me to push these fixes to the branch or if you have any questions!
