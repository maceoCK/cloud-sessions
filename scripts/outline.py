#!/usr/bin/env python3
"""Turn the site's display lines into vector outlines set in Michelangelus.

Two kinds of text: a line is shaped into one outline that never wraps (the
cover, names, numerals); a flow is shaped once and cut into words over a
shared glyph atlas, so the page can set it as words that wrap like text.

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
import math
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
DIGITS = {"zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"}
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

    def flow(self, text, features, key, upright=None, tracking=0):
        """Shape running text once, then cut it into words at the spaces.

        Each word is a list of [glyph key, x] from the word's start plus its
        advance; the glyph outlines go to a shared atlas at the origin, so a
        page can draw any word with <use> and let the words wrap freely.

        The italic's figures are old-style, so in an all-caps word (ED1TH)
        its 1 would read as an i: there the figure comes from the upright
        face, slanted to the italic angle."""
        caps = [False] * len(text)
        at = 0
        for word in text.split(" "):
            core = word.strip(".,:;!?()'\"")
            if core and core.upper() == core and any(c.isdigit() for c in core) and any(c.isalpha() for c in core):
                caps[at:at + len(word)] = [True] * len(word)
            at += len(word) + 1
        slant = math.tan(math.radians(-self.tt["post"].italicAngle))
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, features)
        words = [[0.0, []]]
        atlas = {}
        x = 0.0
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            if text[info.cluster] == " ":
                if words[-1][1]:
                    words.append([0.0, []])
                x = 0.0
                continue
            name = self.order[info.codepoint]
            advance = pos.x_advance
            if upright and slant and caps[info.cluster] and name in DIGITS:
                k = key("l" + name)
                if k not in atlas:
                    pen = SVGPathPen(upright.glyphs, ntos=lambda v: str(rnd(v)))
                    lift = slant * upright.metrics["cap"] / 2
                    upright.glyphs[name].draw(TransformPen(pen, (1, 0, slant, -1, -lift, 0)))
                    atlas[k] = pen.getCommands()
                advance = upright.tt["hmtx"][name][0]
            else:
                k = key(info.codepoint)
                if k not in atlas:
                    atlas[k] = self.outline(name, 0)
            item = [k, rnd(x + pos.x_offset)]
            if pos.y_offset:
                item.append(rnd(-pos.y_offset))
            words[-1][1].append(item)
            x += advance + tracking
            words[-1][0] = rnd(x - tracking)
        return [w for w in words if w[1]], atlas

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
    out = {"font": "Michelangelus", "licence": "Outlines only; the font file is not distributed.", "metrics": faces["regular"].metrics, "lines": {}, "flows": {}, "atlas": {}}
    short = {"regular": "r", "italic": "i", "bold": "b", "bolditalic": "bi"}
    for item in spec:
        style = item.get("style", "regular")
        face = faces[style]
        if item.get("flow"):
            upright = faces[style.replace("italic", "") or "regular"] if "italic" in style else None
            tracking = item.get("tracking", 0) * face.metrics["upm"]
            words, atlas = face.flow(item["text"], item.get("features", {}), lambda gid: f"{short[style]}{gid}", upright, tracking)
            space = face.tt["hmtx"][face.tt.getBestCmap()[32]][0] + 2 * tracking
            out["flows"][item["id"]] = {"text": item["text"], "style": style, "space": space, "words": words}
            out["atlas"].update(atlas)
            continue
        tracking = item.get("tracking", 0) * face.metrics["upm"]
        glyphs, width, box = face.shape(item["text"], item.get("features", {}), tracking)
        entry = {"text": item["text"], "style": item.get("style", "regular"), "width": width, "box": box, "d": "".join(g["d"] for g in glyphs)}
        if item.get("glyphs"):
            entry["glyphs"] = glyphs
        out["lines"][item["id"]] = entry
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(out['lines'])} lines, {len(out['flows'])} flows over {len(out['atlas'])} glyphs, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
