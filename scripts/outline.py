#!/usr/bin/env python3
"""Turn the site's display lines into vector outlines set in Michelangelus.

Michelangelus (Microsoft, studiogusto, for the Fabbrica di San Pietro) is
free to install but its licence grants no right to redistribute the font,
so the site never ships the font file. Instead this script shapes each
display line with HarfBuzz from a local copy of the font and writes only
the resulting outlines to src/type/outlines.json, which the build reads.

    pip install fonttools uharfbuzz
    MICHELANGELUS_DIR=/path/to/fonts python3 scripts/outline.py

Fonts: https://www.microsoft.com/en-us/download/details.aspx?id=108856
"""
import json
import os
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
STRINGS = ROOT / "src" / "type" / "strings.json"  # written by scripts/strings.mjs
OUT = ROOT / "src" / "type" / "outlines.json"
FILES = {
    "regular": "Michelangelus-Regular.ttf",
    "italic": "Michelangelus-Italic.ttf",
    "bold": "Michelangelus-Bold.ttf",
    "bolditalic": "Michelangelus-BoldItalic.ttf",
}


def find_dir():
    candidates = [os.environ.get("MICHELANGELUS_DIR"), str(Path.home() / "Library" / "Fonts"), str(Path.home() / ".fonts"), "/usr/share/fonts/truetype/michelangelus"]
    for c in candidates:
        if c and (Path(c) / FILES["regular"]).exists():
            return Path(c)
    sys.exit("Michelangelus not found. Set MICHELANGELUS_DIR to the folder holding Michelangelus-Regular.ttf.")


def rnd(v):
    r = round(v, 1)
    return int(r) if r == int(r) else r


class Face:
    def __init__(self, path):
        self.tt = TTFont(path)
        blob = hb.Blob.from_file_path(str(path))
        self.hb = hb.Font(hb.Face(blob))
        self.glyphs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        os2 = self.tt["OS/2"]
        self.metrics = {
            "upm": self.tt["head"].unitsPerEm,
            "ascender": self.tt["hhea"].ascent,
            "descender": self.tt["hhea"].descent,
            "cap": os2.sCapHeight,
            "x": os2.sxHeight,
        }

    def outline(self, name, dx, dy=0):
        pen = SVGPathPen(self.glyphs, ntos=lambda v: str(rnd(v)))
        # font units, y up -> svg units, y down, origin on the baseline
        self.glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, dx, dy)))
        return pen.getCommands()

    def bounds(self, name, dx):
        pen = BoundsPen(self.glyphs)
        self.glyphs[name].draw(pen)
        if not pen.bounds:
            return None
        x0, y0, x1, y1 = pen.bounds
        return (x0 + dx, -y1, x1 + dx, -y0)

    def shape(self, text, features, tracking):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, features)
        x = 0.0
        glyphs = []
        box = None
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = self.order[info.codepoint]
            d = self.outline(name, x + pos.x_offset, -pos.y_offset)
            glyphs.append({"d": d, "x": rnd(x + pos.x_offset), "w": rnd(pos.x_advance)})
            b = self.bounds(name, x + pos.x_offset)
            if b:
                box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
            x += pos.x_advance + tracking
        width = x - tracking if glyphs else 0
        # ink bounds [x0, y0, x1, y1] in svg units (y down), for optical alignment
        return glyphs, rnd(width), [rnd(v) for v in (box or (0, 0, 0, 0))]


def main():
    spec = json.loads(STRINGS.read_text())
    folder = find_dir()
    faces = {style: Face(folder / file) for style, file in FILES.items()}
    out = {"font": "Michelangelus", "licence": "Outlines only; the font file is not distributed.", "metrics": faces["regular"].metrics, "lines": {}}
    for item in spec:
        face = faces[item.get("style", "regular")]
        tracking = item.get("tracking", 0) * face.metrics["upm"]
        glyphs, width, box = face.shape(item["text"], item.get("features", {}), tracking)
        entry = {"text": item["text"], "style": item.get("style", "regular"), "width": width, "box": box, "d": "".join(g["d"] for g in glyphs)}
        if item.get("glyphs"):
            entry["glyphs"] = glyphs
        out["lines"][item["id"]] = entry
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(out['lines'])} lines, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
