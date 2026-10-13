# maceo.dev, drawn

The personal site of Maceo Cardinale Kwik, rebuilt as a folio in ink on paper:
a monogram cover (a hairline Michelangelus M over the name), then five
working isometric figures, one for each part of the work. Every figure is a
small machine whose mechanism is the point of that entry, drawn in code with
the [Anatomy](https://github.com/wheresryan22/anatomy) kit and moved by a
model whose numbers show in the card's corner.

| Fig. | Entry | The machine |
| --- | --- | --- |
| I | ED1TH, Datost | Glasses on a fitting stand: model eyes follow the pointer, and the display in the corner of the right lens comes up when the eye glances into it |
| II | Datost | A card cabinet of sixteen drawers, one per private repository, every one locked |
| III | Traba | A punch time clock and a rack of eight shift cards, filled at market speed |
| IV | SimonComputing | An indexing production line: measured, then stamped, then counted (rev 02 to rev 07) |
| V | Virginia Tech | A lead-screw stage that runs two years from Penn State to Virginia Tech; the gauge reads 4.0 |

## Commands

```sh
node scripts/build.mjs               # dist/index.html (the site), plus preview/fragment.html
node scripts/build.mjs --only traba  # one figure's check pages: dist/fig/traba.html and -dark.html
node scripts/shoot.mjs --full        # full-page screenshot into shots/site (needs Playwright)
node scripts/perf.mjs                # frame times idle, scrolling and at the busiest figures
node scripts/og.mjs                  # re-render the share image public/og.jpg from the cover
node scripts/still.mjs save|check    # full-page stills, motion off: prove a change moved nothing
npm run outline                      # re-outline the Michelangelus display lines (see below)
```

The build needs only Node 20.10 or later; it has no dependencies. Deploy
`dist/` (a `vercel.json` is included: build `node scripts/build.mjs`, output
`dist`).

## Where things live

- `src/content.mjs`: every word outside the figures. Facts come only from the
  previous maceo.dev; no em dashes in visible copy.
- `src/page.mjs`: the page shell (cover, contents, figures, contact, seal) and
  its CSS. Colors are tokens: light on `:root`, dark for
  `prefers-color-scheme: dark` unless the reader chose Paper, and dark for an
  explicit Carbon choice.
- `src/figures/<id>.mjs`: one figure each, in the contract described in
  `src/figures/README.md` (build-time geometry plus a `live()` that runs in
  the page).
- `src/runtime.js`: the shared live helpers (one rAF loop per figure that runs
  only on screen, the idle tour, springs).
- `scripts/compact.mjs`: rewrites the figures' straight-line paths in relative
  commands at their own precision (lossless; about a quarter off the page).
- `kit/`: the Anatomy kit, vendored (MIT, see `kit/LICENSE`).
- `src/type/`: the Michelangelus outlines and the list of lines they cover.

## Michelangelus

Display lines (the cover, section heads, names, Roman numerals, the email) are
set in Michelangelus, the typeface studiogusto drew from Michelangelo's
letters for the Fabbrica di San Pietro, and so is every other serif word: the
standfirst, each entry's line and body and the contents. Its
licence from Microsoft lets you install and use it but grants no right to
distribute it ("This agreement does not grant you a license to distribute nor
sublicense all or part of the software to any third party"), so this site
never ships the font file, not even as a webfont.

`scripts/outline.py` shapes the text with HarfBuzz from a local copy and
stores only outlines in `src/type/outlines.json`. A line becomes one outline.
Wrapping text is cut into words over a shared glyph atlas: the page draws each
word as a small inline svg of `<use>` glyphs, with real spaces between words
so they wrap, and the words themselves beside it for screen readers. In
all-caps words set in the italic (ED1TH) the figures come from the upright,
slanted to the italic's 20 degrees, because the italic's old-style 1 reads as
an i. If copy changes without a re-outline, the build warns and sets that text
in a system serif rather than showing stale outlines. To change a display
line, edit `src/content.mjs`, install the font ([Microsoft Download
Center](https://www.microsoft.com/en-us/download/details.aspx?id=108856)),
then:

```sh
pip install fonttools uharfbuzz
MICHELANGELUS_DIR=/path/to/fonts npm run outline
```

## Checks

Each figure passes the Anatomy line check (`line ends: 0`) in both themes:

```sh
node scripts/build.mjs --only <id>
CHROME_PATH=/path/to/chrome node <anatomy>/scripts/lines.mjs dist/fig/<id>.html --reduced
```

Labels are set in Geist Mono (SIL Open Font License, in `src/fonts/`); every
serif word on the page is a Michelangelus outline.
