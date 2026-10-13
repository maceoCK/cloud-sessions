# Fig 5A · Cliff road at night

> 5A. A windy cliff road with no guard rails, with a car drifting around the edges at high speed, its headlights on. At the bottom of the cliff, ocean waves crash against the rock.

An interactive isometric figure built with the [Anatomy](https://github.com/wheresryan22/anatomy) skill. It's a diorama of a chalk headland on a plinth, seen side-on from the sea. A road with no guard rail loops round the cliff top between two tunnel portals. A car drifts the hairpin on the edge, and the swell breaks on the rock 25 m below.

Open `cliff-road.html` (night) or `cliff-road-light.html` (paper). Move the pointer across the figure, drag on a phone, or press ← → to set how hard the driver pushes. The knob on the plinth's front face shows the setting. At the top of the range the car's outer corner clears the unguarded edge by 0.3 m.

## Build

```sh
node figures/cliff-road/build.mjs           # night: cliff-road.html, cliff-road-artifact.html
node figures/cliff-road/build.mjs --light   # paper: cliff-road-light.html
```

The build has no dependencies beyond Node 20. It uses the copy of the Anatomy kit in `anatomy/` (MIT).

## What's modelled (`model.mjs`)

Every number the figure shows comes from this one module: the readout, the tyre marks, the caption and the car's motion.

- **The road** is surveyed as straights and arcs: a 16.8 m hairpin at the tip and a 15 m cove bend on the near leg. It's smoothed to continuous curvature with a cubic B-spline. Lanes are 3.5 m. The verge to the unguarded cliff edge is 0.9–2.4 m.
- **The driver** steers by pure pursuit toward a line that clips the apexes. They plan each corner by what lies on its outside: 84% of the grip where the outside is the drop, all of it where it's rock or grass. They brake before turning in and lift when a slide carries the car toward the edge.
- **The car** is a point mass on a friction circle: damp asphalt under sea mist, μ 0.78 peak and 0.72 sliding. Braking and cornering share the grip. When the demanded cornering exceeds it, the path widens to v²/(μg). The driver then holds the tail out by up to 32°, plus a few degrees of tyre slip, and countersteers.
- **The pace limit** is found by bisection: the fastest pace at which a whole lap clears the edge by 0.3 m.
- **The swell** has an 11 s period, its wavelength from linear dispersion ω² = gk·tanh(kh), and stands 2.4 m from trough to crest at the rock. Crests are refracted round the headland: their phase follows the distance to the coast plus a slant, so each crest comes in from the open sea, hits the tip first and runs back along both cliffs. Small rocks don't bend the swell, so they're left out of that distance. Crests peak as they shoal, and the cliff sends a weaker one back out after each hit. Every visible point of the waterline throws a jet of spray as the crest reaches it.

## Layers

| Layer | What it holds |
|---|---|
| back SVG | plinth, pace knob, bedrock, strata below sea level, the glass sea sections |
| sea canvas | chop, swell, shoaling whitewater, moon glints, waves on the glass |
| terrain SVG | cliff strata, caves, boulders, road, paint, studs, tyre marks, stipple |
| light canvas | headlight pools, tail-light glow, road studs, on the road plane |
| front SVG | hill, portals with their bores, trees, posts, signs, windsock, the car (depth-sorted each frame) |
| fx canvas | spray, tyre smoke, beams in the mist, light on the portal walls and down the bores, sodium glow |

## Checked

- `node anatomy/scripts/lines.mjs cliff-road.html` reports `line ends: 0` in both themes.
- Every canvas's outer ten rows and columns read alpha 0 over a run.
- Without WebGL, the SVG still reads, with a flat water tint.
- Under reduced motion the figure shows one still frame of the drift at the tip, and it still responds to the knob.
- At 390 px wide there's no sideways scroll.
