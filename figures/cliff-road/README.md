# Fig 5A · Cliff road at night

> 5A. A winding cliff road with no guard rails, with a car drifting around the edges at high speed, its headlights on. At the bottom of the cliff, ocean waves crash against the rock.

An animated isometric figure built with the [Anatomy](https://github.com/wheresryan22/anatomy) skill. It's a diorama of a mountain pass on a plinth, seen from the sea, laid out like a pass from Initial D. The road winds down the mountain's face from a tunnel at the summit to one at its foot. It has four legs stacked one above the other and three tight hairpins, two of them on the edge of the sea cliff, and no guard rail anywhere. A car comes down it flat out with its lamps up. It swings sideways through every S-bend, throws itself into the hairpins at 53°, and drops out of sight behind the knolls, spurs and trees. Below, the swell breaks on the rock. Every lap, the drift goes wrong on the last hairpin: the car slides off the edge, tumbles 24 m down the cliff and goes into the sea. Then the next car leaves the summit tunnel.

Open `cliff-road.html` (night) or `cliff-road-light.html` (paper). It isn't interactive: it plays on its own while it's on screen. The dial on the plinth's front face reads the car's speed, 0–120 km/h. Detail A, at the top right, follows the car at 3:1. It shows where the car is going, where its nose points, the drift angle between them, and the gap to the edge.

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
- **The driver** steers by pure pursuit toward a line that clips the apexes. They plan each corner by what lies on its outside: 84% of the grip where the outside is the drop, all of it where it's the hillside. Then they commit past that plan (`COMMIT`): 15% faster down the legs, 3% into the first two hairpins, and 30% into the last, from 40 m out. They brake late and hard, sideways, and lift when a slide carries the car toward the edge.
- **The car** is a 1,150 kg rear-drive coupé with pop-up lamps and two-tone paint. Its motion is a point mass on a friction circle: dry asphalt on sport tyres, μ 1.0 peak and 0.9 sliding. Braking (0.85 g), traction (0.5 g) and cornering share the grip, and gravity adds g·sin θ down the grade. A 9 m hairpin holds on grip up to 34 km/h.
- **The drift** is the driver's, not an accident. Once a bend asks for a third of the grip they throw the tail out, fully by 70%: up to 50° plus a few degrees of tyre slip, and they countersteer. The rear tyres then slide at μ 0.9, and when the demanded cornering exceeds that the path widens to v²/(μg). The S-bends on the legs are gentle enough for the line to take straight, so there the driver swings the tail out into each bend in turn anyway, by up to 30° (a manji), by what the road's own curve would ask at that speed.
- **The lap** runs up to 92 km/h on the legs and takes the first two hairpins at about 40 km/h and 53°, clearing the edge by 1.2 m and 1.3 m. The legs slide for about 5 s of each lap, through nine changes of direction.
- **The last hairpin** comes in at 59 km/h. A third of the way round, the slide carries the car's centre of mass over the unguarded edge at 33 km/h, every lap, and it tips off. It keeps its velocity, gains a small shove outward, and rolls toward the drop and pitches nose-down as the wheels on that side lose the road. Then it's a falling body: gravity, a little air drag, and rock strikes that would throw it back off the cliff, spinning harder. It falls 24 m in 2.2 s and hits the sea at 85 km/h, about 5 m inside the model's edge. In the water the way comes off it in a fraction of a second, and it settles and goes down nose first. Then the next car leaves the summit tunnel.
- **The swell** has an 11 s period, its wavelength from linear dispersion ω² = gk·tanh(kh), and stands 2.4 m from trough to crest at the rock. Crests are refracted round the mountain: their phase follows the distance to the coast plus a slant. Each crest comes in from the open sea, breaks under the hairpins first and runs along the front cliff. Small rocks don't bend the swell, so they're left out of that distance. Crests peak as they shoal, and the cliff sends a weaker one back out after each hit. Every visible point of the waterline throws a jet of spray as the crest reaches it.

## How the mountain is drawn

The mountain is a heightfield. It's built from a slope that falls toward the sea, a summit at the back, and a rock wall at the left that holds both tunnel mouths. It also has a knoll inside each hairpin and three wooded humps on the face, each tall enough to hide a stretch of the leg above it. The road cuts a level bench into it: gravel on the drop side, a shoulder and a cut bank on the hill side. The heightfield is then sliced into 7-unit terraces, like a laser-cut topographic model. Its sea cliffs carry the bedded, jointed rock, caves and wave-cut notch of the earlier headland.

- Terraces are drawn bottom to top. Each piece of road is drawn just after the first terrace above it, so the slope in front of it is already down and the bank behind it comes after.
- Trees, signs, posts and the car stand in a separate layer. Each shows only above the terrain between it and the eye: across its screen width, the highest terrain in front is a line, and it is clipped to above that line. The build does this once for the static things; the page does it every frame for the car, from the drawn height. That's what takes the car out of view behind a knoll and brings it back.
- The headlight pool lies on the road itself: the build stores the road's height beside it in the shader's texture, and each pixel settles onto it. So the pool runs on down the grade ahead of the car, across the terrace steps, and is hidden where terrain stands in front of it. The beams in the mist show in proportion to how much of the lamps is in sight.

## Layers

| Layer | What it holds |
|---|---|
| back SVG | plinth, speed dial, bedrock, terraces below sea level, the glass sea sections |
| sea canvas | chop, swell, shoaling whitewater, the reflected crest, moon glints, waves on the glass; where the car goes in, a white boil and a ring of broken water running out from it |
| terrain SVG | the terraces with the road pieces between them: asphalt, paint, studs, verges, cast retaining walls under the edges, tyre marks, grass |
| light canvas | headlight pool, tail-light glow, the nearest road studs, at the car's height; at night, the tail lamps' streaks as a long exposure would catch them |
| front SVG | the three portals with their bores, the forest, delineators, curve mirrors, chevrons, bend signs, the trig pillar, the car (sorted and clipped each frame; tumbling, it turns about all three axes, and the water closes over it at the sea) |
| fx canvas | spray, tyre smoke, sea mist, beams in the mist, light on the rock face and down the bores, sodium glow in all three tunnel mouths; the crash's dust on rock and its column of spray at the sea |
| detail SVG | Detail A: the car at 3:1 on a local copy of the terraces, with its path, its nose, the drift angle and the gap to the edge; over the edge it follows the fall, with the height left to the sea and the fall traced from where it left the road. A ring and leader mark the car in the main view. Hidden on phones |

## Checked

- `node anatomy/scripts/lines.mjs cliff-road.html` reports `line ends: 0` in both themes, at rest, mid-drift and mid-fall.
- Every canvas's outer ten rows and columns read alpha 0 over a run, the crash and its splash included.
- `CR_CRASH=1 node figures/cliff-road/build.mjs` runs the lap with the mountain and the sea to fall into, at fixed 200, 240 and 288 Hz steps and with six runs of ragged frame times split the way the page splits them. It prints where each one leaves the road and lands. Every one goes over a third of the way round the last hairpin and lands in the sea at the same spot, inside the model.
- Without WebGL, the SVG still reads, with a flat water tint.
- Under reduced motion the figure shows one still frame: the car sideways on the last hairpin, a quarter of a second before it goes over.
- At 390 px wide there's no sideways scroll.
- `CR_OCCLUSION=1 node figures/cliff-road/build.mjs` prints how much of the lap the mountain hides: wholly for 5% of it (the short tunnel and the humps) and partly for another 13%, before the trees.
