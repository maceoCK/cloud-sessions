# Fig 5A · Cliff road at night

> 5A. A winding cliff road with no guard rails, with a car drifting around the edges at high speed, its headlights on. At the bottom of the cliff, ocean waves crash against the rock.

An interactive isometric figure built with the [Anatomy](https://github.com/wheresryan22/anatomy) skill. It's a diorama of a mountain pass on a plinth, seen from the sea, laid out like a pass from Initial D. The road winds down the mountain's face from a tunnel at the summit to one at its foot. It has four legs stacked one above the other and three tight hairpins, two of them on the edge of the sea cliff, and no guard rail anywhere. A car drifts down it with its lamps up and drops out of sight behind the knolls, spurs and trees. Below, the swell breaks on the rock.

Open `cliff-road.html` (night) or `cliff-road-light.html` (paper). Move the pointer across the figure, drag on a phone, or press ← → to set how hard the driver pushes. The knob on the plinth's front face shows the setting. At the top of the range the car's outer corner clears the unguarded edge by 0.3 m. Detail A, at the top right, follows the car at 3:1. It shows where the car is going, where its nose points, the drift angle between them, and the gap to the edge.

## Build

```sh
node figures/cliff-road/build.mjs           # night: cliff-road.html, cliff-road-artifact.html
node figures/cliff-road/build.mjs --light   # paper: cliff-road-light.html
```

The build has no dependencies beyond Node 20. It uses the copy of the Anatomy kit in `anatomy/` (MIT).

## What's modelled (`model.mjs`)

Every number the figure shows comes from this one module: the readout, the tyre marks, the caption and the car's motion.

- **The road** is surveyed as straights and arcs, walked from inside the summit tunnel. There are four legs, each with a pair of gentle S-bends, joined by three 9 m hairpins. On the third leg it runs through a rock rib in a short tunnel. It's smoothed to continuous curvature with a cubic B-spline. Lanes are 3 m. The road falls at a steady 8%, 29 m from tunnel to tunnel over 364 m of open road.
- **The drop** is on the downhill side of each leg, toward the sea, and on the outside of each hairpin. The gravel verge between the asphalt and the unguarded edge is 0.9–2 m, narrowest on the hairpins over the sea.
- **The driver** steers by pure pursuit toward a line that clips the apexes. They plan each corner by what lies on its outside: 84% of the grip where the outside is the drop, all of it where it's the hillside. They brake before turning in, and lift when a slide carries the car toward the edge.
- **The car** is a 1,150 kg rear-drive coupé with pop-up lamps and two-tone paint. Its motion is a point mass on a friction circle: damp asphalt under sea mist, μ 0.78 peak and 0.72 sliding. Braking and cornering share the grip, and gravity adds g·sin θ down the grade. When the demanded cornering exceeds the grip, the path widens to v²/(μg). The driver then holds the tail out by up to 32°, plus a few degrees of tyre slip, and countersteers.
- **The pace limit** is found by bisection: the fastest pace at which a whole lap clears the edge by 0.3 m. At that pace the car reaches 88 km/h on the legs and drifts 35° through each hairpin. Its closest approach to the edge is on the top hairpin over the sea.
- **The swell** has an 11 s period, its wavelength from linear dispersion ω² = gk·tanh(kh), and stands 2.4 m from trough to crest at the rock. Crests are refracted round the mountain: their phase follows the distance to the coast plus a slant. Each crest comes in from the open sea, breaks under the hairpins first and runs along the front cliff. Small rocks don't bend the swell, so they're left out of that distance. Crests peak as they shoal, and the cliff sends a weaker one back out after each hit. Every visible point of the waterline throws a jet of spray as the crest reaches it.

## How the mountain is drawn

The mountain is a heightfield. It's built from a slope that falls toward the sea, a summit at the back, and a rock wall at the left that holds both tunnel mouths. It also has a knoll inside each hairpin and two spurs on the face. The road cuts a level bench into it: gravel on the drop side, a shoulder and a cut bank on the hill side. The heightfield is then sliced into 7-unit terraces, like a laser-cut topographic model. Its sea cliffs carry the bedded, jointed rock, caves and wave-cut notch of the earlier headland.

- Terraces are drawn bottom to top. Each piece of road is drawn just after the first terrace above it, so the slope in front of it is already down and the bank behind it comes after.
- Trees, signs, posts and the car stand in a separate layer. Each shows only above the terrain between it and the eye: across its screen width, the highest terrain in front is a line, and it is clipped to above that line. The build does this once for the static things; the page does it every frame for the car, from the drawn height. That's what takes the car out of view behind a knoll and brings it back.
- The headlight pool lights only ground at the car's own height, and it's hidden where terrain stands in front of it. The beams in the mist show in proportion to how much of the lamps is in sight.

## Layers

| Layer | What it holds |
|---|---|
| back SVG | plinth, pace knob, bedrock, terraces below sea level, the glass sea sections |
| sea canvas | chop, swell, shoaling whitewater, the reflected crest, moon glints, waves on the glass |
| terrain SVG | the terraces with the road pieces between them: asphalt, paint, studs, verges, retaining faces, tyre marks, grass |
| light canvas | headlight pool, tail-light glow, the nearest road studs, at the car's height; at night, the tail lamps' streaks as a long exposure would catch them |
| front SVG | both portals with their bores, the forest, delineators, chevrons, bend signs, the trig pillar, the car (sorted and clipped each frame) |
| fx canvas | spray, tyre smoke, sea mist, beams in the mist, light on the portal walls and down the bores, sodium glow |
| detail SVG | Detail A: the car at 3:1 on a local copy of the terraces, with its path, its nose, the drift angle and the gap to the edge; a ring and leader mark the car in the main view. Hidden on phones |

## Checked

- `node anatomy/scripts/lines.mjs cliff-road.html` reports `line ends: 0` in both themes, at rest and mid-drift.
- Every canvas's outer ten rows and columns read alpha 0 over a run.
- Without WebGL, the SVG still reads, with a flat water tint.
- Under reduced motion the figure shows one still frame of the drift on the lowest hairpin, and it still responds to the knob.
- At 390 px wide there's no sideways scroll.
