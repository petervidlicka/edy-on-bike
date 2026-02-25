This PR looks fantastic! Here's my review on the implementation:

1. **State Management:** The way you freeze the ragdoll state (`this.crashState.elapsed = this.crashState.duration - 0.31`) and then automatically swap over to the regular `drawPlayer` function based on the `ambulancePreRevive` check is seamless and very clever!
2. **Audio Design:** Using the native Web Audio API (`SoundManager.ts`) to synthesize the siren (alternating 600/800Hz with a slight detuned hum) and the ascending major chord arpeggio for the revive is super creative. It adds character to the game without needing external `.mp3` files!
3. **Gameplay Balance:** Adding the `AMBULANCE_CHANCE = 0.25` check combined with `hasBeenResurrected` perfectly prevents infinite resurrection cheese. The mercy speed reduction (`this.speed *= 0.85`) and clearing upcoming obstacles are really nice polish details to avoid insta-dying after a revive.

Amazing work adding this mechanic. The code is extremely clean, handles all the edge cases perfectly, and perfectly integrates with the existing render loops!
