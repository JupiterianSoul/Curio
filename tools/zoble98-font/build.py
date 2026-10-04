import sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from glyphs import G

PX = 100
UPM = 1200
ASC = 1000
DESC = 200


def rects(rows):
    h = len(rows)
    w = max(len(r) for r in rows)
    grid = [[(c == '#') for c in r.ljust(w, '.')] for r in rows]
    used = [[False] * w for _ in range(h)]
    out = []
    for y in range(h):
        x = 0
        while x < w:
            if grid[y][x] and not used[y][x]:
                x1 = x
                while x1 < w and grid[y][x1] and not used[y][x1]:
                    x1 += 1
                y1 = y + 1
                while y1 < h and all(grid[y1][k] and not used[y1][k] for k in range(x, x1)) and (x == 0 or not grid[y1][x - 1] or used[y1][x - 1]) and (x1 == w or not grid[y1][x1] or used[y1][x1]):
                    y1 += 1
                for yy in range(y, y1):
                    for k in range(x, x1):
                        used[yy][k] = True
                out.append((x, y, x1, y1))
                x = x1
            else:
                x += 1
    return out


def bolden(rows):
    out = []
    for r in rows:
        r2 = r + '.'
        out.append(''.join('#' if (r2[i] == '#' or (i > 0 and r2[i - 1] == '#')) else '.' for i in range(len(r2))))
    return out


def build(path, bold, family):
    names = ['.notdef']
    cmap = {}
    glyphs = {}
    metrics = {}
    pen = TTGlyphPen(None)
    for x0, y0, x1, y1 in [(0, 0, 5, 1), (0, 7, 5, 8), (0, 1, 1, 7), (4, 1, 5, 7)]:
        pen.moveTo((PX + x0 * PX, ASC - (2 + y0) * PX))
        pen.lineTo((PX + x1 * PX, ASC - (2 + y0) * PX))
        pen.lineTo((PX + x1 * PX, ASC - (2 + y1) * PX))
        pen.lineTo((PX + x0 * PX, ASC - (2 + y1) * PX))
        pen.closePath()
    glyphs['.notdef'] = pen.glyph()
    metrics['.notdef'] = (7 * PX, PX)
    for ch, (rows, top) in sorted(G.items(), key=lambda kv: ord(kv[0])):
        widths = {len(r) for r in rows}
        assert len(widths) == 1, (ch, rows)
        if bold and rows and any('#' in r for r in rows):
            rows = bolden(rows)
        w = len(rows[0])
        name = 'uni%04X' % ord(ch)
        names.append(name)
        cmap[ord(ch)] = name
        pen = TTGlyphPen(None)
        blank = True
        for x0, y0, x1, y1 in rects(rows):
            blank = False
            r0 = 2 + top + y0
            r1 = 2 + top + y1
            X0, X1 = x0 * PX, x1 * PX
            Y0, Y1 = ASC - r0 * PX, ASC - r1 * PX
            pen.moveTo((X0, Y0))
            pen.lineTo((X1, Y0))
            pen.lineTo((X1, Y1))
            pen.lineTo((X0, Y1))
            pen.closePath()
        glyphs[name] = pen.glyph()
        adv = (w + 1) * PX
        if ch in (' ', ' '):
            adv = 3 * PX
        metrics[name] = (adv, 0)
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(names)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC, descent=-DESC, lineGap=300)
    style = 'Bold' if bold else 'Regular'
    fb.setupNameTable({'familyName': family, 'styleName': style, 'uniqueFontIdentifier': f'{family} {style}', 'fullName': f'{family} {style}', 'psName': family.replace(' ', '') + '-' + style, 'version': 'Version 1.000', 'copyright': 'Zoble 98 pixel font, drawn for Zoble'})
    fb.setupOS2(sTypoAscender=ASC, sTypoDescender=-DESC, sTypoLineGap=300, usWinAscent=ASC + 150, usWinDescent=DESC + 150, sxHeight=600, sCapHeight=800, usWeightClass=700 if bold else 400, fsSelection=(0x20 if bold else 0x40) | 0x80, achVendID='ZOBL', version=4)
    fb.setupPost()
    fb.setupHead(unitsPerEm=UPM)
    if bold:
        fb.font['head'].macStyle = 1
    fb.font.flavor = 'woff2'
    fb.save(path)


build(sys.argv[1], False, 'Zoble 98')
build(sys.argv[2], True, 'Zoble 98')
print('built', len(G), 'glyphs')
