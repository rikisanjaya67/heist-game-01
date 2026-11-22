# Midnight at the Halden Gallery

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/rikisanjaya67/heist-game-01/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/rikisanjaya67/heist-game-01/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist in one dark museum vault room. The thief slips in at midnight to
lift three paintings and the Halden Star diamond, then slip out the east door — while five
patrolling guards sweep the room with raycast vision cones, three wall cameras sweep theirs,
and an alarm meter climbs every second an eye is on the thief.

- **Several routes:** pedestals, vitrines, benches and the grand statue give cover and
  shadows to plan around; every loot piece can be reached more than one way.
- **Two gadgets, each with a cost:** a tossed coin (3) rings on the marble and pulls nearby
  guards over to look; an EMP (2) freezes all three cameras for six seconds.
- **Read the cones before you move:** cones are amber while calm and flare red the moment
  they spot you; above 55% alarm the guards stop patrolling and hunt. Sneak (Shift) to
  shrink what the cones can see.
- **Win** by taking all four pieces and reaching the exit; **lose** when a guard catches
  you or the alarm hits 100%.

Play it offline: serve `game/` with any static server and open `game/index.html` in desktop
Chrome. WASD / arrows to move, mouse click to steer, Shift to sneak, `1` for a coin,
`2` for an EMP, `P` to pause. `?seed=N` fixes the night; `?shot=start|play|end&seed=1`
stages the three screenshot scenes.

All art is drawn in code (Canvas 2D) and all sounds are synthesized with WebAudio — no
images, fonts or audio files, and no network requests. Vanilla JavaScript, no libraries.
