#!/usr/bin/env python3
"""
Generate all pixel art assets for the Multiverse Platformer.
Outputs PNG files to frontend/public/assets/.

Usage:  python3 tools/generate_assets.py
"""

import json, math, os, random, subprocess, sys

RENDER = os.path.expanduser('~/.claude/skills/pixel-art-gen/scripts/render_pixel_art.py')
OUT    = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'assets')

# ── helpers ──────────────────────────────────────────────────────────────────

class Canvas:
    """Sparse pixel canvas. Only paint pixels that differ from the background."""
    def __init__(self, w, h, bg='#000000'):
        self.w, self.h, self.bg = w, h, bg
        self._px = {}          # (x,y) -> color  (later writes win)

    def put(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self._px[(x, y)] = c

    def hline(self, y, x0, x1, c):
        for x in range(x0, x1+1): self.put(x, y, c)

    def vline(self, x, y0, y1, c):
        for y in range(y0, y1+1): self.put(x, y, c)

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1+1):
            for x in range(x0, x1+1): self.put(x, y, c)

    def rect_outline(self, x0, y0, x1, y1, c):
        self.hline(y0, x0, x1, c); self.hline(y1, x0, x1, c)
        self.vline(x0, y0, y1, c); self.vline(x1, y0, y1, c)

    def render(self, filename, pixel_size=1):
        os.makedirs(OUT, exist_ok=True)
        path = os.path.join(OUT, filename)
        data = {
            'width': self.w, 'height': self.h,
            'background': self.bg, 'pixel_size': pixel_size,
            'pixels': [{'x': x, 'y': y, 'color': c} for (x,y), c in self._px.items()]
        }
        r = subprocess.run([sys.executable, RENDER, '-', '-o', path],
                           input=json.dumps(data), capture_output=True, text=True)
        if r.returncode != 0:
            print(f'  ERROR {filename}: {r.stderr.strip()}', file=sys.stderr)
        else:
            print(f'  {r.stdout.strip()}')


def lerp(a, b, t): return a + (b - a) * t


# ── BACKGROUNDS (80×50, pixel_size=10 → 800×500 px) ─────────────────────────

def bg_seiya():
    """Level 1 — Saint Seiya: Sanctuary of Athena at night."""
    c = Canvas(80, 50, '#060E1E')
    rng = random.Random(11)

    # Sky gradient — slightly lighter toward horizon
    for y in range(10, 26):
        t = (y - 10) / 15
        r_ = int(lerp(0x06, 0x12, t))
        g_ = int(lerp(0x0E, 0x22, t))
        b_ = int(lerp(0x1E, 0x44, t))
        c.hline(y, 0, 79, f'#{r_:02X}{g_:02X}{b_:02X}')

    # Stars
    for _ in range(80):
        sx, sy = rng.randint(0, 79), rng.randint(0, 20)
        col = rng.choice(['#FFFFFF', '#FFFFFF', '#C8D8FF', '#FFE8C0', '#AAAACF'])
        c.put(sx, sy, col)

    # Pegasus constellation (upper-right) — gold dots + dim connecting lines
    stars_pg = [(52,2),(55,1),(58,3),(61,2),(64,4),(62,6),(66,8),(61,7),(57,6),(55,4),(52,5)]
    for sx, sy in stars_pg:
        c.put(sx, sy, '#FFD700')
    for i in range(len(stars_pg)-1):
        x0,y0 = stars_pg[i]; x1,y1 = stars_pg[i+1]
        mx,my = (x0+x1)//2, (y0+y1)//2
        c.put(mx, my, '#6A4A00')

    # Cosmic energy rings around sanctuary peak (ellipses, blue → gold)
    for radius, col in [(9,'#1A2E6A'),(10,'#2244AA'),(11,'#3355CC'),(12,'#224488')]:
        for ang in range(0, 360, 6):
            rad = math.radians(ang)
            ex = int(40 + radius * 1.6 * math.cos(rad))
            ey = int(24 + radius * 0.55 * math.sin(rad))
            c.put(ex, ey, col)
    # Gold outer ring highlights
    for ang in range(0, 360, 18):
        rad = math.radians(ang)
        ex = int(40 + 13 * 1.6 * math.cos(rad))
        ey = int(24 + 13 * 0.55 * math.sin(rad))
        c.put(ex, ey, '#886600')

    # Mountain silhouette — peaked profile
    def mountain_top(x):
        pts = [(0,49),(10,46),(20,40),(30,32),(36,26),(40,20),(44,26),(50,32),(60,40),(70,46),(79,49)]
        for i in range(len(pts)-1):
            x0,y0 = pts[i]; x1,y1 = pts[i+1]
            if x0 <= x <= x1:
                t = (x - x0) / (x1 - x0)
                return int(lerp(y0, y1, t))
        return 49

    for x in range(80):
        mt = mountain_top(x)
        c.vline(x, mt, 49, '#0D0D20')
        c.put(x, mt, '#181828')   # bright edge

    # Temple complex on peak (x 29-52, y 14-26)
    # Platform base
    c.rect(28, 24, 52, 25, '#C4B888')
    c.rect(28, 24, 52, 24, '#DDD0A0')  # top highlight

    # Columns (every 4 px from x=31 to x=50)
    for cx in range(31, 51, 4):
        c.rect(cx, 17, cx+1, 24, '#D4C898')
        c.put(cx, 17, '#EEECC0')   # column top cap highlight
        c.put(cx, 24, '#A09070')   # column base shadow

    # Pediment (triangular roof)
    for i in range(6):
        ry = 16 - i
        c.hline(ry, 40-i, 40+i, '#B0A470')
    c.hline(16, 29, 52, '#9A8E68')   # entablature

    # Glow from temple windows (warm orange)
    for gx, gy in [(35,21),(39,21),(43,21),(47,21)]:
        c.put(gx, gy, '#FF9900')
        c.put(gx+1, gy, '#FF8800')
        for dx in [-1,0,1,2]:
            for dy in [-1,0,1]:
                c.put(gx+dx, gy+dy+1, '#441100' if abs(dx)+abs(dy)>1 else '#882200')

    # Secondary smaller temple (left side x=12-20, y=33-39)
    c.rect(12, 37, 20, 38, '#B0A478')
    for cx2 in [13,16,19]:
        c.vline(cx2, 32, 37, '#C4B888')
    c.hline(31, 11, 21, '#9A8E68')
    for i in range(3):
        c.hline(30-i, 16-i, 16+i, '#B0A070')

    # Staircase (rows 26-43 stepping down from mountain)
    for step in range(10):
        step_y = 27 + step * 1
        xl = 28 - step*1
        xr = 52 + step*1
        xl = max(0, xl); xr = min(79, xr)
        alt = '#A09070' if step % 2 == 0 else '#8A7A60'
        shadow = '#6A5A48' if step % 2 == 0 else '#5A4A38'
        c.hline(step_y, xl, xr, alt)
        c.hline(step_y+1, xl, xr, shadow) if step_y+1 <= 49 else None

    # Foreground ground (rows 44-49)
    for y in range(44, 50):
        shade = ['#4A3828','#3E3020','#342820','#2C2018','#241810','#1C1208'][y-44]
        c.hline(y, 0, 79, shade)

    # Stone pavers on ground (decorative lines)
    for gx in range(0, 80, 8):
        c.vline(gx, 44, 49, '#5A4838')
    for gy in range(44, 50, 2):
        c.hline(gy, 0, 79, '#3A2C1C')

    c.render('bg_seiya.png', pixel_size=10)


def bg_hogwarts():
    """Level 2 — Harry Potter: Gringotts Bank interior + treasure vault."""
    c = Canvas(80, 50, '#0E0A08')
    rng = random.Random(22)

    # Arched stone ceiling (rows 0-12)
    c.rect(0, 0, 79, 12, '#1A1410')
    # Arch details — three gothic arches across the ceiling
    for arch_cx in [13, 40, 67]:
        # Outer arch curve
        for ang in range(0, 181, 4):
            rad = math.radians(ang)
            ax = int(arch_cx + 10 * math.cos(rad))
            ay = int(8 - 8 * math.sin(rad))
            c.put(ax, ay, '#2E2820')
        # Inner arch
        for ang in range(0, 181, 4):
            rad = math.radians(ang)
            ax = int(arch_cx + 7 * math.cos(rad))
            ay = int(8 - 7 * math.sin(rad))
            c.put(ax, ay, '#3E3830')
        # Keystone
        c.rect(arch_cx-1, 0, arch_cx+1, 2, '#504840')

    # Ceiling ribs
    for rib_x in [0, 26, 53, 79]:
        c.vline(rib_x, 0, 12, '#281E18')

    # Stone wall left (x 0-7)
    c.rect(0, 12, 7, 49, '#28201A')
    for wy in range(12, 50, 4):
        c.hline(wy, 0, 7, '#322820')
    for wy in range(14, 50, 8):
        c.hline(wy, 0, 3, '#3A3028')

    # Stone wall right (x 72-79)
    c.rect(72, 12, 79, 49, '#28201A')
    for wy in range(12, 50, 4):
        c.hline(wy, 72, 79, '#322820')

    # Left torches (x≈3, y≈16 and y≈32)
    for ty in [16, 32]:
        c.rect(2, ty, 4, ty+2, '#7A5A30')   # sconce bracket
        c.put(3, ty-1, '#FFCC00')            # flame bright
        c.put(3, ty-2, '#FF9900')
        c.put(2, ty-2, '#FF8800'); c.put(4, ty-2, '#FF8800')
        c.put(3, ty-3, '#FF6600')
        # Torch glow radius
        for dx in range(-6, 7):
            for dy in range(-5, 6):
                dist = math.sqrt(dx*dx + dy*dy*1.2)
                if 2 < dist < 6:
                    cx2 = 3+dx; cy2 = ty+dy
                    if 0 <= cx2 < 80 and 0 <= cy2 < 50:
                        alpha_val = max(0x10, int(0x30 * (1 - dist/6)))
                        c.put(cx2, cy2, f'#{"3A2010":s}')

    # Right torches
    for ty in [16, 32]:
        c.rect(75, ty, 77, ty+2, '#7A5A30')
        c.put(76, ty-1, '#FFCC00')
        c.put(76, ty-2, '#FF9900')
        c.put(75, ty-2, '#FF8800'); c.put(77, ty-2, '#FF8800')
        c.put(76, ty-3, '#FF6600')

    # Floor (rows 44-49) — dark stone with gold glints
    c.rect(0, 44, 79, 49, '#1C1610')
    for fx in range(0, 80, 6):
        c.hline(44, fx, fx+4, '#28201A')
    for _ in range(25):
        gx = rng.randint(8, 71); gy = rng.randint(45, 49)
        c.put(gx, gy, rng.choice(['#FFD700','#CCA800','#886600']))

    # Background vault door (center-back, rows 22-43 x 30-52)
    c.rect(30, 22, 52, 43, '#3A3020')
    c.rect_outline(30, 22, 52, 43, '#6A5A30')
    # Vault door rings/locking mechanism
    for ring_r in [3, 5, 7, 9]:
        for ang in range(0, 360, 12):
            rad = math.radians(ang)
            vx = int(41 + ring_r * math.cos(rad))
            vy = int(32 + ring_r * 0.7 * math.sin(rad))
            c.put(vx, vy, '#8A7440')
    c.rect(38, 29, 44, 35, '#504030')  # center lock
    c.put(41, 32, '#FFD700')           # keyhole glint

    # Treasure spilling out lower-center (rows 36-43 x 32-50)
    for _ in range(120):
        gx = rng.randint(32, 50); gy = rng.randint(37, 43)
        col = rng.choice(['#FFD700','#FFD700','#CCA800','#E8B800','#CC8800',
                          '#FF4444','#4488FF','#44AA44'])  # gold + gems
        c.put(gx, gy, col)
    # Pile shape (denser at center)
    for i in range(5):
        c.hline(43-i, 34+i//2, 48-i//2, '#FFD700')

    # Goblin teller window (left mid, x 8-18 y 20-32)
    c.rect(8, 20, 18, 32, '#2A2218')
    c.rect_outline(8, 20, 18, 32, '#4A3828')
    c.hline(26, 8, 18, '#5A4838')   # counter ledge
    # Window bars
    for bx in [11, 14, 17]:
        c.vline(bx, 20, 26, '#6A5040')
    # Goblin silhouette behind bars
    c.rect(12, 21, 14, 25, '#1A1208')   # head
    c.put(12, 22, '#2A1A10'); c.put(14, 22, '#2A1A10')  # eyes

    # Mirror of Erised (right side, x 60-72 y 18-42)
    c.rect(60, 18, 72, 42, '#1A1210')
    c.rect_outline(60, 18, 72, 42, '#8A6840')
    # Ornate frame top
    c.hline(18, 60, 72, '#B08840')
    c.hline(19, 61, 71, '#C09850')
    for mx in range(61, 72, 2):
        c.put(mx, 17, '#C09850')
    # Mirror surface (slightly lighter, blue tint)
    c.rect(62, 20, 70, 41, '#14202C')
    # Ghostly reflection glow
    for gy2 in range(20, 42):
        for gx2 in range(62, 71):
            if rng.random() < 0.08:
                c.put(gx2, gy2, rng.choice(['#2244AA','#1A3380','#334488']))
    # Inscription on mirror frame (ERised stra ehru oyt)
    c.hline(43, 60, 72, '#7A5A20')
    c.hline(44, 60, 72, '#6A4A18')

    c.render('bg_hogwarts.png', pixel_size=10)


def bg_pokemon():
    """Level 3 — Pokemon: Tall Grass Route 1, daytime."""
    c = Canvas(80, 50, '#6BBCEE')
    rng = random.Random(33)

    # Sky gradient top→horizon
    for y in range(0, 20):
        t = y / 20
        r_ = int(lerp(0x4A, 0x8A, t))
        g_ = int(lerp(0x9E, 0xCC, t))
        b_ = int(lerp(0xD8, 0xF0, t))
        c.hline(y, 0, 79, f'#{r_:02X}{g_:02X}{b_:02X}')

    # Clouds (fluffy white blobs)
    cloud_data = [(8,4,12),(28,3,10),(50,5,14),(70,3,9)]
    for (cx2, cy2, sz) in cloud_data:
        for dx in range(-sz, sz+1):
            for dy in range(-sz//2, sz//2+1):
                dist = (dx/sz)**2 + (dy/(sz*0.6))**2
                if dist < 1.0:
                    brite = '#FFFFFF' if dist < 0.5 else '#EEF4FF'
                    c.put(cx2+dx, cy2+dy, brite)
        # Cloud shadow bottom
        for dx in range(-sz+2, sz-1):
            c.put(cx2+dx, cy2+sz//2, '#DDEEFF')

    # Distant purple mountains (rows 14-22)
    def mtn(x):
        peaks = [(0,22),(15,17),(25,14),(35,18),(45,15),(55,13),(65,17),(79,22)]
        for i in range(len(peaks)-1):
            x0,y0=peaks[i]; x1,y1=peaks[i+1]
            if x0<=x<=x1:
                t=(x-x0)/(x1-x0); return int(lerp(y0,y1,t))
        return 22
    for x in range(80):
        mt = mtn(x)
        c.put(x, mt, '#9988BB')
        c.vline(x, mt+1, 23, '#7766AA')

    # Green rolling hills (rows 20-34)
    def hill(x):
        return int(28 - 5*math.sin(x*0.12) - 3*math.sin(x*0.07+1))
    for x in range(80):
        ht = hill(x)
        c.put(x, ht, '#63C74D')
        c.vline(x, ht+1, ht+2, '#4DA83C')
        c.vline(x, ht+3, 34, '#3A8A2A')

    # Tree line (rows 22-33, scattered)
    tree_xs = [3,9,16,23,58,64,70,76]
    for tx in tree_xs:
        # Trunk
        c.vline(tx+2, 30, 34, '#8B4513')
        c.vline(tx+3, 30, 34, '#6B3510')
        # Foliage (layered circles)
        for layer, (oy, sz2) in enumerate([(29,4),(26,5),(23,4)]):
            for dx in range(-sz2, sz2+1):
                for dy in range(-sz2//2, sz2//2+1):
                    if dx**2 + (dy*1.5)**2 < sz2**2 * 0.9:
                        shade = ['#265C42','#3E8948','#63C74D'][layer]
                        c.put(tx+dx+2, oy+dy, shade)

    # Path / road (diagonal S-curve, light tan)
    for y in range(28, 50):
        px_offset = int(35 + 10*math.sin((y-28)*0.15))
        for dx in range(-3, 4):
            shade = '#C8A870' if abs(dx) < 2 else '#B89460'
            c.put(px_offset+dx, y, shade)
        # Path edge detail
        c.put(px_offset-3, y, '#9A7848')
        c.put(px_offset+3, y, '#9A7848')

    # Ground base (rows 35-49)
    for y in range(35, 50):
        c.hline(y, 0, 79, '#3E8948')
    for y in range(44, 50):
        c.hline(y, 0, 79, '#2E6A38' if y % 2 == 0 else '#3A7A40')

    # Tall grass patches (foreground, rows 38-48)
    for gx in range(0, 80, 3):
        if rng.random() < 0.6:
            gh = rng.randint(36, 42)
            col = rng.choice(['#265C42','#2A6844','#1E5038','#347040'])
            c.vline(gx, gh, 48, col)
            c.put(gx, gh, '#63C74D')  # tip highlight
            if rng.random() < 0.4:
                c.put(gx+1, gh+1, '#4DA83C')

    # Pokemon Center in far background (rows 22-32, x 36-46 — small)
    c.rect(36, 22, 46, 31, '#FF6666')
    c.rect(36, 22, 46, 23, '#CC3333')   # red roof
    c.rect(39, 25, 43, 31, '#FFCCCC')   # door/window area
    c.put(41, 27, '#66AAFF')            # window
    c.put(42, 27, '#66AAFF')
    c.hline(31, 34, 48, '#886644')      # ground shadow under center

    # Sunny yellow glow top-right corner
    for _ in range(12):
        sx = rng.randint(65, 79); sy = rng.randint(0, 8)
        c.put(sx, sy, '#FFFF88')

    c.render('bg_pokemon.png', pixel_size=10)


def bg_starwars():
    """Level 4 — Star Wars: Death Star trench approach."""
    c = Canvas(80, 50, '#000311')
    rng = random.Random(44)

    # Distant stars
    for _ in range(90):
        c.put(rng.randint(0,79), rng.randint(0,49),
              rng.choice(['#FFFFFF','#FFFFFF','#C8D0FF','#FFE8C8','#AAAAFF']))

    # Nebula patches (faint)
    for _ in range(4):
        nx = rng.randint(5,75); ny = rng.randint(5,35); nr = rng.randint(5,10)
        col = rng.choice(['#0A0A22','#080820','#060618'])
        for dx in range(-nr, nr+1):
            for dy in range(-nr//2, nr//2+1):
                if (dx/nr)**2+(dy/(nr*0.6))**2 < 1:
                    c.put(nx+dx, ny+dy, col)

    # Death Star (partially visible, rows 3-35, right side x 50-79)
    ds_cx, ds_cy, ds_r = 70, 18, 25
    for x in range(50, 80):
        for y in range(0, 50):
            dx = x - ds_cx; dy = y - ds_cy
            dist = math.sqrt(dx*dx + dy*dy)
            if dist < ds_r:
                # Metallic gray surface
                brightness = 1 - dist/ds_r * 0.4
                shade = int(0x3A * brightness)
                shade2 = int(0x44 * brightness)
                c.put(x, y, f'#{shade:02X}{shade2:02X}{shade:02X}')
                # Surface detail: horizontal panel lines
                if dy % 4 == 0 and dist < ds_r - 1:
                    c.put(x, y, '#2A3030')
                # Vertical trench line on Death Star surface
                if abs(dx) < 2 and dist < ds_r - 1:
                    c.put(x, y, '#1A2020')
            elif dist < ds_r + 1:
                c.put(x, y, '#0A1010')   # edge glow (dark)

    # Superlaser dish crater (on Death Star, smaller circle, offset)
    crater_cx, crater_cy = 62, 10
    for ang in range(0, 360, 8):
        rad = math.radians(ang)
        for r2 in [3, 4, 5]:
            ex = int(crater_cx + r2 * math.cos(rad))
            ey = int(crater_cy + r2 * 0.8 * math.sin(rad))
            c.put(ex, ey, '#1A2828' if r2 < 5 else '#2A3838')
    c.rect(crater_cx-2, crater_cy-1, crater_cx+2, crater_cy+1, '#0D1818')

    # Trench walls — top and bottom strips of the scene
    for y in range(0, 6):
        alpha = 1 - y/6
        shade = int(0x30 * alpha + 0x18)
        c.hline(y, 0, 49, f'#{shade:02X}{shade:02X}{shade:02X}')
        # Panel lines on trench wall
        for tx in range(0, 50, 5):
            c.put(tx, y, f'#{max(0,shade-0x10):02X}{max(0,shade-0x10):02X}{max(0,shade-0x10):02X}')

    for y in range(44, 50):
        alpha = (y-44)/6
        shade = int(0x30 * alpha + 0x18)
        c.hline(y, 0, 49, f'#{shade:02X}{shade:02X}{shade:02X}')
        for tx in range(0, 50, 5):
            c.put(tx, y, f'#{max(0,shade-0x10):02X}{max(0,shade-0x10):02X}{max(0,shade-0x10):02X}')

    # Laser cannon emplacements on trench edges
    for cx3 in [5, 18, 32, 44]:
        # Top cannon
        c.rect(cx3, 3, cx3+3, 6, '#384040')
        c.rect(cx3+1, 0, cx3+2, 3, '#283030')   # barrel
        c.put(cx3+1, 0, '#506060')               # tip
        # Bottom cannon (mirrored)
        c.rect(cx3, 43, cx3+3, 46, '#384040')
        c.rect(cx3+1, 46, cx3+2, 49, '#283030')
        c.put(cx3+1, 49, '#506060')

    # Distant Star Destroyer silhouette (top-left, very faint)
    # Triangular wedge
    for i in range(12):
        ys = 2+i//2
        c.hline(ys, 2+i, 2+i+8, '#1A1E20' if i < 6 else '#141820')
    # Bridge tower
    c.rect(9, 1, 12, 4, '#1E2224')
    # Engine glow
    for _ in range(3):
        ex2 = rng.randint(10,13)
        c.put(ex2, 6, '#4488BB')

    # Green targeting laser beam (faint, atmospheric)
    for y in range(8, 42):
        if rng.random() < 0.3:
            c.put(30, y, '#004400')
            c.put(31, y, '#006600')
            c.put(32, y, '#004400')

    c.render('bg_starwars.png', pixel_size=10)


# ── SPRITES ──────────────────────────────────────────────────────────────────
# All sprites rendered at pixel_size=2 (double res) — display size set in BootScene.
# Player spritesheet: 4 frames × 32×48 = 128×48 grid → 256×96 PNG

def sprite_player_seiya():
    """Pegasus Bronze Saint — 4-frame 128×48 spritesheet (pixel_size=2)."""
    c = Canvas(128, 48, 'transparent')

    OL = '#1A1C2C'    # outline
    SK = '#E0AC69'    # skin
    SK2= '#C68642'    # skin shadow
    HR = '#1C0E08'    # dark hair
    HR2= '#2E1810'    # hair mid
    BR = '#CD7F32'    # bronze bright
    BR2= '#B87333'    # bronze mid
    BR3= '#7A4E1A'    # bronze dark
    CL = '#E8E0C8'    # white cloth
    CL2= '#C8C0A8'    # cloth shadow
    RD = '#CC2222'    # red Pegasus accent
    GD = '#FFD700'    # gold trim
    EY = '#2244BB'    # eyes
    EW = '#EEEEFF'    # eye white

    def frame(ox, pose):
        # pose: 'stand','walk1','walk2','jump'
        # ── HEAD (centered at ox+16) ──
        # Hair top
        c.rect(ox+11,0, ox+20,1, HR)
        c.rect(ox+10,1, ox+21,3, HR)
        c.put(ox+9,2, HR2); c.put(ox+22,2, HR2)
        # Helmet wings (Pegasus cloth accessory — small wings on sides)
        c.put(ox+8, 3, RD); c.put(ox+9,3, RD)
        c.put(ox+22,3, RD); c.put(ox+23,3, RD)
        c.put(ox+7, 4, RD); c.put(ox+24,4, RD)
        # Face skin
        c.rect(ox+11,2, ox+20,7, SK)
        # Outline
        c.hline(1, ox+11, ox+20, OL)
        c.vline(ox+10, 2, 7, OL); c.vline(ox+21,2,7, OL)
        # Eyes
        c.put(ox+13,4, EW); c.put(ox+14,4, EW)
        c.put(ox+17,4, EW); c.put(ox+18,4, EW)
        c.put(ox+13,5, EY); c.put(ox+18,5, EY)
        # Nose & mouth
        c.put(ox+16,6, SK2)
        c.put(ox+14,7, OL); c.put(ox+15,7, OL); c.put(ox+17,7, OL); c.put(ox+18,7, OL)
        # Chin / neck
        c.rect(ox+14,7, ox+17,8, SK2)
        c.rect(ox+14,8, ox+17,9, SK)

        # ── SCARF / COLLAR ──
        c.rect(ox+11,8, ox+20,9, CL)
        c.hline(9, ox+10, ox+21, OL)

        # ── CHEST ARMOR ──
        c.rect(ox+9, 10, ox+22, 20, BR2)
        # Chest highlight (left-top)
        c.rect(ox+10,10, ox+14,14, BR)
        # Chest shadow (right)
        c.rect(ox+19,10, ox+22,20, BR3)
        # Pegasus wing motif on chest (white V-shape)
        c.put(ox+13,12, CL); c.put(ox+14,13, CL); c.put(ox+15,14, CL)
        c.put(ox+16,14, CL); c.put(ox+17,13, CL); c.put(ox+18,12, CL)
        c.put(ox+14,12, CL2); c.put(ox+17,12, CL2)
        # Gold trim at armor edges
        c.hline(10, ox+9, ox+22, GD)
        c.put(ox+9,10, OL); c.put(ox+22,10, OL)
        # Shoulder pauldrons
        c.rect(ox+6, 10, ox+9, 15, BR)
        c.rect(ox+23,10, ox+26,15, BR)
        c.put(ox+6,10, GD); c.put(ox+23,10, GD)

        # ── ARMS ──
        if pose == 'walk1':
            # Left arm forward, right arm back
            c.rect(ox+4,15, ox+7,24, BR2)
            c.rect(ox+25,15,ox+28,22, BR3)
        elif pose == 'walk2':
            c.rect(ox+4,15, ox+7,22, BR3)
            c.rect(ox+25,15,ox+28,24, BR2)
        elif pose == 'jump':
            # Arms slightly raised
            c.rect(ox+3,12, ox+7,20, BR2)
            c.rect(ox+25,12,ox+29,20, BR2)
        else:  # stand
            c.rect(ox+5,15, ox+8,24, BR2)
            c.rect(ox+24,15,ox+27,24, BR2)
        # Gauntlets / fists
        c.rect(ox+5,24, ox+8,26, BR3)
        c.rect(ox+24,24,ox+27,26, BR3)

        # ── WAIST / CLOTH BELT ──
        c.rect(ox+9, 21, ox+22, 26, CL)
        c.hline(21, ox+9, ox+22, CL2)
        c.hline(26, ox+8, ox+23, OL)
        # Belt buckle
        c.rect(ox+14,22, ox+17,24, GD)
        c.put(ox+15,23, BR2)

        # ── THIGHS ──
        if pose == 'walk1':
            # Left leg forward
            c.rect(ox+10,27, ox+14,33, BR)
            c.rect(ox+16,27, ox+20,33, BR3)
        elif pose == 'walk2':
            c.rect(ox+10,27, ox+14,33, BR3)
            c.rect(ox+16,27, ox+20,33, BR)
        elif pose == 'jump':
            # Legs tucked / together
            c.rect(ox+10,27, ox+14,31, BR)
            c.rect(ox+16,27, ox+20,31, BR)
        else:
            c.rect(ox+10,27, ox+14,33, BR2)
            c.rect(ox+16,27, ox+20,33, BR2)

        # ── GREAVES (shin armor) ──
        if pose == 'walk1':
            c.rect(ox+9, 33, ox+14,40, BR2)
            c.rect(ox+16,33, ox+21,40, BR3)
        elif pose == 'walk2':
            c.rect(ox+9, 33, ox+14,40, BR3)
            c.rect(ox+16,33, ox+21,40, BR2)
        elif pose == 'jump':
            c.rect(ox+9, 31, ox+14,37, BR2)
            c.rect(ox+16,31, ox+21,37, BR2)
        else:
            c.rect(ox+9, 33, ox+14,40, BR2)
            c.rect(ox+16,33, ox+21,40, BR2)

        # Knee cap on greaves
        c.put(ox+11,33, BR); c.put(ox+18,33, BR)

        # ── BOOTS ──
        by = 40 if pose == 'jump' else 40
        c.rect(ox+8, by, ox+14,45, BR3)
        c.rect(ox+16,by, ox+22,45, BR3)
        c.hline(by, ox+8, ox+14, BR2); c.hline(by, ox+16, ox+22, BR2)
        # Boot soles
        c.hline(45, ox+8, ox+15, OL)
        c.hline(45, ox+15, ox+22, OL)

        # ── OUTLINE CLEANUP ──
        c.rect_outline(ox+9,10, ox+22,26, OL)
        c.rect_outline(ox+9,27, ox+14,45, OL)
        c.rect_outline(ox+16,27, ox+21,45, OL)

    frame(0,  'stand')
    frame(32, 'walk1')
    frame(64, 'walk2')
    frame(96, 'jump')

    c.render('player_seiya.png', pixel_size=2)


def sprite_player_saga():
    """Gemini Saga — Gold Saint, 4-frame 128×48 spritesheet (pixel_size=2)."""
    c = Canvas(128, 48, 'transparent')

    OL = '#1A1C2C'   # outline
    SK = '#E0AC69'   # skin
    SK2= '#C68642'   # skin shadow
    HR = '#1C1428'   # dark hair (black-purple)
    HR2= '#302040'   # hair highlight
    GD = '#FFD700'   # gold bright
    GD2= '#CC9900'   # gold mid
    GD3= '#886600'   # gold dark
    GDS= '#6A5000'   # gold shadow
    CL = '#E8E8F0'   # white cloth
    CL2= '#B8B8D0'   # cloth shadow
    GE = '#44AACC'   # Saga's blue-green eyes
    EW = '#EEEEFF'   # eye white
    CP = '#18103A'   # dark navy cape
    CP2= '#241848'   # cape highlight
    RD = '#880000'   # red gem (Gemini emblem)

    def frame(ox, pose):
        # Long hair (behind head — drawn first so armor overlaps)
        c.rect(ox+8, 2, ox+11, 18, HR)
        c.rect(ox+21, 2, ox+24, 18, HR)
        c.put(ox+7, 4, HR2); c.put(ox+8, 3, HR2)
        c.put(ox+23, 3, HR2); c.put(ox+24, 4, HR2)

        # Cape (behind body)
        c.rect(ox+6, 9, ox+26, 30, CP)
        c.hline(9, ox+6, ox+26, CP2)

        # Head — hair top
        c.rect(ox+10, 0, ox+21, 2, HR)
        c.put(ox+9, 1, HR); c.put(ox+22, 1, HR)
        # Face skin
        c.rect(ox+11, 2, ox+20, 8, SK)
        c.vline(ox+10, 2, 8, OL); c.vline(ox+21, 2, 8, OL)
        c.hline(1, ox+10, ox+21, OL)
        # Cold eyes
        c.put(ox+13, 4, EW); c.put(ox+14, 4, EW)
        c.put(ox+17, 4, EW); c.put(ox+18, 4, EW)
        c.put(ox+13, 5, GE); c.put(ox+18, 5, GE)
        # Sharp eyebrows (stern expression)
        c.hline(3, ox+12, ox+15, OL)
        c.hline(3, ox+17, ox+20, OL)
        c.put(ox+15, 6, SK2)
        c.hline(7, ox+13, ox+18, OL)
        c.rect(ox+14, 8, ox+17, 10, SK2)

        # Collar
        c.rect(ox+11, 9, ox+20, 10, CL)
        c.hline(10, ox+10, ox+21, OL)

        # Chest armor (ornate gold)
        c.rect(ox+9, 11, ox+22, 22, GD2)
        c.rect(ox+10, 11, ox+15, 15, GD)
        c.rect(ox+19, 11, ox+22, 22, GD3)
        # Gemini twin-soul gem (red + teal)
        c.put(ox+14, 14, RD); c.put(ox+15, 13, RD)
        c.put(ox+16, 14, GE); c.put(ox+15, 15, GE)
        c.hline(11, ox+9, ox+22, GD)
        c.hline(22, ox+8, ox+23, GD)
        # Large pauldrons
        c.rect(ox+5, 10, ox+9, 17, GD)
        c.rect(ox+23, 10, ox+27, 17, GD)
        c.hline(10, ox+5, ox+9, GD3)
        c.hline(10, ox+23, ox+27, GD3)
        c.put(ox+5, 10, OL); c.put(ox+27, 10, OL)

        # Arms
        if pose == 'walk1':
            c.rect(ox+3, 17, ox+7, 26, GD2)
            c.rect(ox+25, 17, ox+29, 23, GD3)
        elif pose == 'walk2':
            c.rect(ox+3, 17, ox+7, 23, GD3)
            c.rect(ox+25, 17, ox+29, 26, GD2)
        elif pose == 'jump':
            c.rect(ox+2, 13, ox+7, 21, GD2)
            c.rect(ox+25, 13, ox+29, 21, GD2)
        else:
            c.rect(ox+4, 17, ox+8, 26, GD2)
            c.rect(ox+24, 17, ox+28, 26, GD2)
        c.rect(ox+4, 26, ox+8, 28, GDS)
        c.rect(ox+24, 26, ox+28, 28, GDS)

        # Waist / belt
        c.rect(ox+9, 23, ox+22, 27, CL)
        c.hline(23, ox+9, ox+22, CL2)
        c.hline(27, ox+8, ox+23, OL)
        c.rect(ox+14, 23, ox+18, 26, GD)
        c.put(ox+15, 24, RD)

        # Thighs
        if pose == 'walk1':
            c.rect(ox+10, 28, ox+14, 35, GD)
            c.rect(ox+16, 28, ox+20, 35, GD3)
        elif pose == 'walk2':
            c.rect(ox+10, 28, ox+14, 35, GD3)
            c.rect(ox+16, 28, ox+20, 35, GD)
        elif pose == 'jump':
            c.rect(ox+10, 28, ox+14, 32, GD)
            c.rect(ox+16, 28, ox+20, 32, GD)
        else:
            c.rect(ox+10, 28, ox+14, 35, GD2)
            c.rect(ox+16, 28, ox+20, 35, GD2)

        # Greaves
        if pose == 'walk1':
            c.rect(ox+9, 35, ox+14, 42, GD2)
            c.rect(ox+16, 35, ox+21, 42, GD3)
        elif pose == 'walk2':
            c.rect(ox+9, 35, ox+14, 42, GD3)
            c.rect(ox+16, 35, ox+21, 42, GD2)
        elif pose == 'jump':
            c.rect(ox+9, 32, ox+14, 38, GD2)
            c.rect(ox+16, 32, ox+21, 38, GD2)
        else:
            c.rect(ox+9, 35, ox+14, 42, GD2)
            c.rect(ox+16, 35, ox+21, 42, GD2)

        # Boots
        c.rect(ox+8, 42, ox+14, 46, GD3)
        c.rect(ox+16, 42, ox+22, 46, GD3)
        c.hline(42, ox+8, ox+14, GD2)
        c.hline(42, ox+16, ox+22, GD2)
        c.hline(46, ox+8, ox+15, OL)
        c.hline(46, ox+15, ox+22, OL)

        c.rect_outline(ox+9, 11, ox+22, 27, OL)
        c.rect_outline(ox+9, 28, ox+14, 46, OL)
        c.rect_outline(ox+16, 28, ox+21, 46, OL)

    frame(0,  'stand')
    frame(32, 'walk1')
    frame(64, 'walk2')
    frame(96, 'jump')

    c.render('player_saga.png', pixel_size=2)


def sprite_player_harry():
    """Harry Potter — 4-frame 128×48 spritesheet (pixel_size=2)."""
    c = Canvas(128, 48, 'transparent')

    OL = '#0A0A14'   # outline
    SK = '#E0C8A8'   # skin
    SK2= '#C8A888'   # skin shadow
    HR = '#1E1410'   # dark messy hair
    HR2= '#2E2418'   # hair detail
    RB = '#1A1A2A'   # black robe
    RB2= '#0E0E18'   # robe shadow
    RB3= '#2A2A3A'   # robe highlight
    WD = '#6B4423'   # wand wood
    WG = '#FFEEAA'   # wand tip glow
    GS = '#222233'   # glasses wire
    EY = '#3A8A3A'   # Harry's green eyes
    EW = '#EEEEFF'   # eye white
    SC = '#CC2222'   # Gryffindor red tie
    GL = '#FFD700'   # gold stripe on tie
    SR = '#FF7755'   # lightning bolt scar

    def frame(ox, pose):
        # Robes (wider at bottom — drawn first)
        c.rect(ox+8, 20, ox+24, 46, RB2)
        c.rect(ox+9, 22, ox+23, 45, RB)
        if pose == 'walk1':
            c.rect(ox+14, 30, ox+18, 45, RB3)
        elif pose == 'walk2':
            c.rect(ox+14, 32, ox+18, 45, RB2)

        # Head — messy hair
        c.rect(ox+11, 0, ox+21, 3, HR)
        c.put(ox+10, 1, HR); c.put(ox+22, 1, HR)
        c.put(ox+9, 2, HR2); c.put(ox+23, 2, HR2)
        c.put(ox+12, 0, HR); c.put(ox+15, 0, HR2); c.put(ox+18, 0, HR)
        # Face
        c.rect(ox+11, 2, ox+21, 9, SK)
        c.vline(ox+10, 2, 9, OL); c.vline(ox+22, 2, 9, OL)
        c.hline(1, ox+11, ox+21, OL)
        # Lightning bolt scar (forehead)
        c.put(ox+14, 2, SR)
        c.put(ox+15, 3, SR)
        c.put(ox+14, 4, SR)
        # Glasses (round wire frames)
        c.hline(5, ox+12, ox+14, GS); c.hline(5, ox+17, ox+19, GS)
        c.put(ox+11, 6, GS); c.put(ox+15, 6, GS)
        c.put(ox+16, 6, GS); c.put(ox+20, 6, GS)
        c.hline(7, ox+12, ox+14, GS); c.hline(7, ox+17, ox+19, GS)
        # Eyes
        c.put(ox+13, 6, EY); c.put(ox+18, 6, EY)
        c.put(ox+15, 6, GS); c.put(ox+16, 6, GS)
        c.put(ox+16, 8, SK2)
        c.hline(9, ox+14, ox+18, OL)
        c.rect(ox+14, 9, ox+18, 11, SK2)

        # Gryffindor tie
        c.rect(ox+13, 10, ox+19, 13, SC)
        c.put(ox+14, 11, GL); c.put(ox+17, 11, GL)

        # Robe upper body
        c.rect(ox+9, 12, ox+23, 22, RB)
        c.rect(ox+10, 12, ox+14, 18, RB3)
        c.rect(ox+20, 12, ox+23, 22, RB2)
        c.vline(ox+13, 12, 22, RB3)
        c.vline(ox+19, 12, 22, RB3)

        # Arms / sleeves
        if pose == 'walk1':
            c.rect(ox+4, 14, ox+9, 24, RB)
            c.rect(ox+23, 14, ox+28, 21, RB2)
            c.rect(ox+2, 21, ox+5, 23, WD)
            c.put(ox+2, 21, WG)
        elif pose == 'walk2':
            c.rect(ox+4, 14, ox+9, 21, RB2)
            c.rect(ox+23, 14, ox+28, 24, RB)
            c.rect(ox+27, 21, ox+30, 23, WD)
            c.put(ox+29, 21, WG)
        elif pose == 'jump':
            c.rect(ox+3, 11, ox+8, 20, RB)
            c.rect(ox+24, 11, ox+29, 20, RB)
            c.rect(ox+2, 17, ox+5, 19, WD)
            c.put(ox+2, 17, WG)
        else:
            c.rect(ox+5, 14, ox+9, 24, RB)
            c.rect(ox+23, 14, ox+27, 24, RB)
            c.rect(ox+5, 23, ox+8, 26, WD)
            c.put(ox+5, 23, WG)
        c.rect(ox+5, 24, ox+8, 26, SK)
        c.rect(ox+24, 24, ox+27, 26, SK)

        # Boots (peek under robes)
        c.rect(ox+9, 42, ox+15, 46, RB2)
        c.rect(ox+17, 42, ox+23, 46, RB2)
        c.hline(46, ox+9, ox+15, OL)
        c.hline(46, ox+17, ox+23, OL)

        c.rect_outline(ox+9, 12, ox+23, 22, OL)
        c.rect_outline(ox+8, 22, ox+24, 46, OL)

    frame(0,  'stand')
    frame(32, 'walk1')
    frame(64, 'walk2')
    frame(96, 'jump')

    c.render('player_harry.png', pixel_size=2)


def sprite_player_ash():
    """Ash Ketchum — 4-frame 128×48 spritesheet (pixel_size=2)."""
    c = Canvas(128, 48, 'transparent')

    OL = '#1A1C2C'   # outline
    SK = '#F0C880'   # Ash skin
    SK2= '#D4A860'   # skin shadow
    HR = '#1A1418'   # spiky black hair
    RC = '#CC2222'   # red cap
    CW = '#F0F0F0'   # cap white panel
    BJ = '#3355AA'   # blue jacket
    BJ2= '#4466CC'   # jacket highlight
    BS = '#1A1A2A'   # black shirt/pants
    BS2= '#0E0E18'   # pants shadow
    GL = '#DDAA44'   # fingerless gloves
    PB = '#CC2222'   # Pokéball red
    PW = '#F0F0F0'   # Pokéball white
    SH = '#1A44AA'   # shoes
    EY = '#6B3C1A'   # eyes (dark brown)

    def frame(ox, pose):
        # Cap
        c.rect(ox+9, 0, ox+22, 4, RC)
        c.put(ox+8, 1, RC); c.put(ox+23, 1, RC)
        c.hline(4, ox+9, ox+25, RC)   # brim
        c.hline(5, ox+11, ox+24, RC)
        c.rect(ox+12, 1, ox+18, 3, CW)  # white panel

        # Spiky hair (sides below cap)
        c.put(ox+9, 4, HR); c.put(ox+10, 3, HR)
        c.put(ox+21, 4, HR); c.put(ox+22, 3, HR)
        c.put(ox+9, 6, HR); c.put(ox+10, 6, HR)
        c.put(ox+21, 6, HR); c.put(ox+22, 6, HR)

        # Face
        c.rect(ox+10, 4, ox+21, 11, SK)
        c.vline(ox+9, 4, 11, OL); c.vline(ox+22, 4, 11, OL)
        c.hline(3, ox+9, ox+22, OL)
        # Eyes
        c.put(ox+12, 7, EY); c.put(ox+13, 7, EY)
        c.put(ox+18, 7, EY); c.put(ox+19, 7, EY)
        # Ash's cheek marks (two small lines each side)
        c.put(ox+10, 8, SK2); c.put(ox+11, 9, SK2)
        c.put(ox+20, 8, SK2); c.put(ox+21, 9, SK2)
        c.put(ox+15, 9, SK2)
        c.put(ox+14, 10, OL); c.put(ox+16, 10, OL)
        # Neck
        c.rect(ox+14, 10, ox+17, 12, SK2)

        # Black collar
        c.rect(ox+12, 11, ox+19, 13, BS)
        c.hline(13, ox+11, ox+20, OL)

        # Blue jacket
        c.rect(ox+9, 13, ox+22, 24, BJ)
        c.rect(ox+10, 13, ox+14, 19, BJ2)
        c.vline(ox+15, 13, 23, BS)
        c.vline(ox+16, 13, 23, BS)
        c.hline(13, ox+9, ox+22, BJ2)

        # Pokéball on belt
        c.rect(ox+13, 23, ox+18, 26, OL)
        c.hline(23, ox+13, ox+18, PB)
        c.hline(24, ox+13, ox+18, PB)
        c.hline(25, ox+13, ox+18, PW)
        c.hline(24, ox+14, ox+17, OL)

        # Arms / gloves
        if pose == 'walk1':
            c.rect(ox+4, 15, ox+9, 25, BJ)
            c.rect(ox+23, 15, ox+28, 22, BJ)
        elif pose == 'walk2':
            c.rect(ox+4, 15, ox+9, 22, BJ)
            c.rect(ox+23, 15, ox+28, 25, BJ)
        elif pose == 'jump':
            c.rect(ox+3, 13, ox+8, 22, BJ)
            c.rect(ox+24, 13, ox+29, 22, BJ)
        else:
            c.rect(ox+5, 15, ox+9, 25, BJ)
            c.rect(ox+23, 15, ox+27, 25, BJ)
        c.rect(ox+5, 25, ox+9, 28, GL)
        c.rect(ox+23, 25, ox+27, 28, GL)

        # Black pants
        if pose == 'walk1':
            c.rect(ox+10, 27, ox+14, 37, BS)
            c.rect(ox+16, 27, ox+20, 37, BS2)
        elif pose == 'walk2':
            c.rect(ox+10, 27, ox+14, 37, BS2)
            c.rect(ox+16, 27, ox+20, 37, BS)
        elif pose == 'jump':
            c.rect(ox+10, 27, ox+14, 32, BS)
            c.rect(ox+16, 27, ox+20, 32, BS)
        else:
            c.rect(ox+10, 27, ox+14, 37, BS)
            c.rect(ox+16, 27, ox+20, 37, BS)

        # Shoes
        c.rect(ox+8, 37, ox+15, 41, SH)
        c.rect(ox+16, 37, ox+23, 41, SH)
        c.hline(41, ox+8, ox+15, OL)
        c.hline(41, ox+16, ox+23, OL)

        c.rect_outline(ox+9, 13, ox+22, 27, OL)
        c.rect_outline(ox+9, 27, ox+15, 41, OL)
        c.rect_outline(ox+16, 27, ox+22, 41, OL)

    frame(0,  'stand')
    frame(32, 'walk1')
    frame(64, 'walk2')
    frame(96, 'jump')

    c.render('player_ash.png', pixel_size=2)


def sprite_player_anakin():
    """Anakin Skywalker — 4-frame 128×48 spritesheet (pixel_size=2)."""
    c = Canvas(128, 48, 'transparent')

    OL = '#0A0808'   # outline
    SK = '#E0AC69'   # skin
    SK2= '#C68642'   # skin shadow
    MH = '#888888'   # mechanical right hand
    HR = '#1E1008'   # dark brown hair
    HR2= '#2E2018'   # hair highlight
    RB = '#2E1C10'   # dark robe
    RB2= '#1E1008'   # robe shadow
    RB3= '#3E2C20'   # robe highlight
    BL = '#44AAFF'   # lightsaber blade
    BLG= '#88CCFF'   # blade glow
    BL2= '#AADDFF'   # blade core
    LH = '#666666'   # saber handle
    BT = '#1A1010'   # belt
    EY = '#5A3A10'   # intense eyes

    def frame(ox, pose):
        # Head — short dark hair
        c.rect(ox+11, 0, ox+21, 3, HR)
        c.put(ox+10, 1, HR); c.put(ox+22, 1, HR)
        c.put(ox+9, 2, HR2)
        # Face
        c.rect(ox+11, 2, ox+21, 9, SK)
        c.vline(ox+10, 2, 9, OL); c.vline(ox+22, 2, 9, OL)
        c.hline(1, ox+11, ox+21, OL)
        # Intense eyes (narrowed/determined)
        c.put(ox+13, 4, SK); c.put(ox+14, 4, SK)
        c.put(ox+17, 4, SK); c.put(ox+18, 4, SK)
        c.put(ox+13, 5, EY); c.put(ox+18, 5, EY)
        c.hline(3, ox+12, ox+15, HR)
        c.hline(3, ox+17, ox+20, HR)
        c.put(ox+15, 7, SK2)
        c.hline(8, ox+13, ox+19, OL)
        c.rect(ox+14, 8, ox+18, 11, SK2)

        # Collar
        c.rect(ox+12, 10, ox+20, 12, RB3)
        c.hline(12, ox+10, ox+22, OL)

        # Dark robe torso
        c.rect(ox+9, 12, ox+23, 24, RB)
        c.rect(ox+10, 12, ox+15, 17, RB3)
        c.rect(ox+20, 12, ox+23, 24, RB2)
        c.vline(ox+14, 12, 24, RB3)
        c.vline(ox+18, 12, 24, RB2)
        c.rect(ox+9, 22, ox+23, 24, BT)
        c.hline(22, ox+9, ox+23, OL)
        c.rect(ox+7, 12, ox+9, 16, RB2)
        c.rect(ox+23, 12, ox+25, 16, RB2)

        # Arms
        if pose == 'walk1':
            c.rect(ox+3, 14, ox+8, 26, RB)
            c.rect(ox+24, 14, ox+29, 21, RB2)
            c.vline(ox+4, 22, 35, BL)
            c.vline(ox+5, 23, 33, BLG)
            c.put(ox+5, 23, BL2)
        elif pose == 'walk2':
            c.rect(ox+3, 14, ox+8, 21, RB2)
            c.rect(ox+24, 14, ox+29, 26, RB)
            c.vline(ox+27, 22, 35, BL)
            c.vline(ox+26, 23, 33, BLG)
            c.put(ox+26, 23, BL2)
        elif pose == 'jump':
            c.rect(ox+2, 11, ox+7, 20, RB)
            c.rect(ox+25, 11, ox+29, 20, RB)
            c.vline(ox+4, 6, 20, BL)
            c.vline(ox+5, 7, 18, BLG)
            c.put(ox+5, 7, BL2)
        else:
            c.rect(ox+4, 14, ox+8, 26, RB)
            c.rect(ox+24, 14, ox+28, 26, RB)
            c.vline(ox+4, 26, 42, BL)
            c.vline(ox+5, 27, 40, BLG)
            c.put(ox+5, 27, BL2)

        # Lightsaber handle (left hand)
        c.rect(ox+4, 24, ox+7, 27, LH)
        c.hline(24, ox+4, ox+7, OL)
        # Mechanical right hand (slightly metallic sheen)
        c.rect(ox+24, 24, ox+28, 27, MH)
        c.hline(25, ox+24, ox+28, '#AAAAAA')

        # Lower robes (flowing)
        if pose == 'walk1':
            c.rect(ox+8, 25, ox+16, 40, RB)
            c.rect(ox+16, 25, ox+24, 40, RB2)
        elif pose == 'walk2':
            c.rect(ox+8, 25, ox+16, 40, RB2)
            c.rect(ox+16, 25, ox+24, 40, RB)
        elif pose == 'jump':
            c.rect(ox+9, 25, ox+23, 35, RB)
        else:
            c.rect(ox+8, 25, ox+24, 40, RB)
            c.vline(ox+16, 25, 40, RB3)

        # Boots
        c.rect(ox+8, 40, ox+15, 44, RB2)
        c.rect(ox+17, 40, ox+24, 44, RB2)
        c.hline(44, ox+8, ox+15, OL)
        c.hline(44, ox+17, ox+24, OL)

        c.rect_outline(ox+9, 12, ox+23, 24, OL)
        c.rect_outline(ox+8, 24, ox+15, 44, OL)
        c.rect_outline(ox+17, 24, ox+24, 44, OL)

    frame(0,  'stand')
    frame(32, 'walk1')
    frame(64, 'walk2')
    frame(96, 'jump')

    c.render('player_anakin.png', pixel_size=2)


def sprite_enemy_seiya():
    """Silver Saint enemy — menacing, silver armor, 28×28 (pixel_size=2)."""
    c = Canvas(28, 28, 'transparent')
    OL='#1A1C2C'; SI='#8899AA'; SI2='#AABBCC'; SI3='#5A6A7A'
    SK='#C08040'; HR='#0A0808'; EY='#CC2222'

    # Body silhouette (bulkier than player)
    c.rect(6,12,21,24, SI)
    # Head
    c.rect(9,2,18,10, SI2)
    c.put(9,2,OL);c.put(18,2,OL)
    c.hline(2,10,17,OL)
    # Helmet visor (menacing red eyes)
    c.rect(10,4,17,7, SI3)
    c.put(10,5,EY);c.put(11,5,EY)
    c.put(15,5,EY);c.put(16,5,EY)
    c.put(10,6,EY);c.put(11,6,EY)
    c.put(15,6,EY);c.put(16,6,EY)
    # Shoulder guards (spiky)
    c.rect(3,12,6,17,SI2);c.put(2,11,SI2);c.put(1,10,SI)
    c.rect(21,12,24,17,SI2);c.put(25,11,SI2);c.put(26,10,SI)
    # Chest detail
    c.hline(13,7,20,SI2)
    # Arms
    c.rect(3,17,6,23,SI3);c.rect(21,17,24,23,SI3)
    # Fists
    c.rect(3,23,6,25,SI);c.rect(21,23,24,25,SI)
    # Legs
    c.rect(8,24,12,27,SI3);c.rect(15,24,19,27,SI3)
    c.hline(27,7,20,OL)
    c.rect_outline(6,12,21,24,OL)
    c.rect_outline(9,2,18,10,OL)

    c.render('enemy_seiya.png', pixel_size=2)


def sprite_enemy_dementor():
    """Dementor — hooded dark wraith, 28×28 (pixel_size=2)."""
    c = Canvas(28, 28, 'transparent')
    DK='#0A0818'; DK2='#140E24'; AC='#1A1230'
    HL='#8878CC'; GL='#220044'

    # Hood/cloak silhouette
    c.rect(6,0,21,6,DK2)
    c.rect(4,4,23,16,DK)
    c.rect(3,10,24,22,DK2)
    # Hood peak
    c.put(13,0,DK2);c.put(14,0,DK2)
    # Face void (darker hole inside hood)
    c.rect(9,5,18,12,GL)
    # Glowing eyes
    c.put(11,8,HL);c.put(12,8,HL)
    c.put(15,8,HL);c.put(16,8,HL)
    # Wispy tendrils at bottom
    for tx in [5,9,14,19,23]:
        c.vline(tx,22,27,DK)
        c.put(tx,22,AC)
        if tx%2==0: c.put(tx,26,DK2)
    # Ghostly hands reaching out
    c.put(2,14,AC);c.put(1,15,DK2);c.put(2,16,AC)
    c.put(25,14,AC);c.put(26,15,DK2);c.put(25,16,AC)
    # Outline (subtle)
    for x in range(3,25):
        top=next((y for y in range(28) if c._px.get((x,y)) not in (None,'transparent')),None)
        if top is not None: c.put(x,top,DK2)

    c.render('enemy_dementor.png', pixel_size=2)


def sprite_enemy_pokemon(etype):
    """Pokemon-style creature enemy. etype: 'fire','leaf','wing'."""
    c = Canvas(28, 28, 'transparent')
    OL = '#1A1C2C'

    configs = {
        'fire': dict(body='#E84020', hi='#F87050', sh='#A01808', eye='#FFFF00',
                     acc='#FF8800', fname='enemy_pokemon_fire.png'),
        'leaf': dict(body='#2EAA40', hi='#50CC60', sh='#1A7828', eye='#FFFF00',
                     acc='#88FF44', fname='enemy_pokemon_leaf.png'),
        'wing': dict(body='#2260CC', hi='#4488EE', sh='#1040AA', eye='#FFFF00',
                     acc='#88CCFF', fname='enemy_pokemon_wing.png'),
    }
    cfg = configs[etype]

    # Round body
    for dx in range(-9,10):
        for dy in range(-8,9):
            dist = (dx/9)**2 + (dy/8)**2
            if dist < 1.0:
                shade = cfg['hi'] if (dx<-2 and dy<-2) else (cfg['sh'] if (dx>3 and dy>3) else cfg['body'])
                c.put(14+dx, 16+dy, shade)
            elif dist < 1.15:
                c.put(14+dx, 16+dy, OL)

    # Eyes
    c.rect(11,13,12,14,cfg['eye']); c.put(11,13,OL); c.put(12,14,OL)
    c.rect(16,13,17,14,cfg['eye']); c.put(16,13,OL); c.put(17,14,OL)
    c.put(12,13,'#1A1C2C'); c.put(17,13,'#1A1C2C')  # pupils

    # Type-specific feature
    if etype == 'fire':
        # Flame on top
        for fy,fw in [(7,2),(5,3),(4,4),(6,3)]:
            c.hline(fy, 13-fw//2, 13+fw//2, '#FF6600')
        c.put(13,5,'#FFCC00'); c.put(14,4,'#FF9900')
    elif etype == 'leaf':
        # Leaf hat
        c.rect(10,6,17,9, cfg['acc'])
        c.hline(6,11,16,'#44CC44')
        c.put(13,5,cfg['acc']); c.put(14,5,cfg['acc'])
    elif etype == 'wing':
        # Wings on sides
        c.rect(3,12,7,18,cfg['acc'])
        c.hline(12,3,7,OL); c.hline(18,3,7,OL)
        c.rect(20,12,24,18,cfg['acc'])
        c.hline(12,20,24,OL); c.hline(18,20,24,OL)

    # Feet
    c.rect(9,23,12,25,OL); c.rect(9,23,11,24,cfg['body'])
    c.rect(16,23,19,25,OL); c.rect(16,18,18,24,cfg['body'])

    c.render(cfg['fname'], pixel_size=2)


def sprite_coin():
    """Spinning coin — 16×16 (pixel_size=2 → 32×32)."""
    c = Canvas(16, 16, 'transparent')
    GD='#FFD700'; GD2='#E8B800'; GD3='#CC9900'; HL='#FFFFC0'; OL='#7A5A00'

    for dx in range(-6,7):
        for dy in range(-6,7):
            dist = dx**2+dy**2
            if dist <= 36:
                shade = HL if (dx==-2 and dy==-2) else (GD if dist<25 else GD2)
                c.put(8+dx, 8+dy, shade)
            elif dist <= 42:
                c.put(8+dx, 8+dy, OL)
    # Shine
    c.put(6,6,HL); c.put(7,5,HL); c.put(5,7,'#FFFFF0')
    # Inner detail ($ or star)
    c.put(8,7,GD3); c.put(8,8,GD3); c.put(8,9,GD3)
    c.put(7,8,GD3); c.put(9,8,GD3)

    c.render('coin.png', pixel_size=2)


def sprite_orb_hp():
    """Magical orb for HP level — 16×16 (pixel_size=2)."""
    c = Canvas(16, 16, 'transparent')
    PR='#9B59B6'; PR2='#C06BE0'; PR3='#6A2A88'; HL='#EE88FF'; OL='#3A1050'

    for dx in range(-6,7):
        for dy in range(-6,7):
            dist = dx**2+dy**2
            if dist<=36:
                shade = HL if dist<9 else (PR2 if dist<20 else PR)
                c.put(8+dx,8+dy,shade)
            elif dist<=42:
                c.put(8+dx,8+dy,OL)
    c.put(6,6,HL); c.put(5,5,HL)
    # Magic sparkles
    c.put(11,5,'#FFFFFF'); c.put(5,11,'#DDAAFF')

    c.render('orb_hp.png', pixel_size=2)


def sprite_pokeball():
    """Pokéball collectible — 16×16 (pixel_size=2)."""
    c = Canvas(16, 16, 'transparent')
    RD='#CC2222'; WH='#F0F0F0'; BK='#1A1C2C'; GY='#AAAAAA'

    # Top half (red)
    for dx in range(-6,7):
        for dy in range(-6,0):
            if dx**2+dy**2<=36: c.put(8+dx,8+dy,RD)
    c.put(6,5,GY); c.put(5,6,GY)  # shine

    # Bottom half (white)
    for dx in range(-6,7):
        for dy in range(0,7):
            if dx**2+dy**2<=36: c.put(8+dx,8+dy,WH)

    # Center band
    c.hline(7,2,13,BK); c.hline(8,2,13,BK)
    # Center button
    for dx in range(-2,3):
        for dy in range(-2,3):
            if dx**2+dy**2<=4: c.put(8+dx,8+dy,WH)
    c.rect_outline(6,6,9,9,BK)

    # Outline
    for dx in range(-6,7):
        for dy in range(-6,7):
            if 36 < dx**2+dy**2 <= 42: c.put(8+dx,8+dy,BK)

    c.render('pokeball.png', pixel_size=2)


# ── PLATFORM TILES (32×16, pixel_size=2 → 64×32) ────────────────────────────

def tile_platform_seiya():
    """Greek stone column tile for Saint Seiya level."""
    c = Canvas(32, 16, 'transparent')
    ST='#C4B888'; ST2='#A89C70'; ST3='#DDD0A0'; OL='#1A1C2C'; SD='#7A6E52'

    c.rect(0,0,31,15,ST2)
    # Top highlight row
    c.hline(0,0,31,ST3)
    # Bottom shadow
    c.hline(15,0,31,SD)
    c.hline(14,0,31,SD)
    # Column-like vertical grooves every 8px
    for gx in [7,15,23]:
        c.vline(gx,0,15,ST)
        c.vline(gx+1,0,15,SD)
    # Horizontal mortar line
    c.hline(7,0,31,SD)
    c.hline(8,0,31,ST3)
    # Outline
    c.hline(0,0,31,OL)
    c.hline(15,0,31,OL)

    c.render('platform_seiya.png', pixel_size=2)


def tile_platform_hogwarts():
    """Dark gothic stone for HP level."""
    c = Canvas(32, 16, 'transparent')
    BK='#2A2018'; BK2='#1A140E'; BK3='#3E3020'; GD='#6A5828'; OL='#0A0808'

    c.rect(0,0,31,15,BK)
    # Stone blocks pattern
    c.hline(8,0,31,BK2)
    c.hline(9,0,31,BK3)
    for gx in [0,10,21]:
        c.vline(gx,0,8,BK2)
    for gx in [5,16,26]:
        c.vline(gx,9,15,BK2)
    # Gold vein detail
    c.put(4,3,GD); c.put(5,4,GD); c.put(20,11,GD); c.put(21,12,GD)
    c.hline(0,0,31,GD)  # gold top trim
    c.hline(1,0,31,BK3)
    c.hline(15,0,31,OL)

    c.render('platform_hogwarts.png', pixel_size=2)


def tile_platform_pokemon():
    """Grass-topped earth for Pokemon level."""
    c = Canvas(32, 16, 'transparent')
    GR='#3E8948'; GR2='#63C74D'; GR3='#265C42'
    BR='#8B4513'; BR2='#6B3510'; DR='#4A2808'

    c.rect(0,4,31,15,BR)
    c.rect(0,7,31,15,BR2)
    c.rect(0,11,31,15,DR)
    # Grass top
    c.hline(3,0,31,GR2)
    c.hline(4,0,31,GR)
    c.hline(5,0,31,GR3)
    c.hline(6,0,31,GR)
    # Grass blades
    for gx in range(1,31,3):
        c.put(gx,1,GR2); c.put(gx,2,GR)
        if gx%6==1: c.put(gx,0,GR2)
    # Dirt texture dots
    for dx in range(2,30,6):
        c.put(dx,9,'#5A3010'); c.put(dx+3,12,'#3A2008')

    c.render('platform_pokemon.png', pixel_size=2)


def tile_platform_starwars():
    """Death Star trench metal tile."""
    c = Canvas(32, 16, 'transparent')
    MT='#384040'; MT2='#283030'; MT3='#485858'; OL='#1A2020'

    c.rect(0,0,31,15,MT)
    # Panel lines
    c.hline(4,0,31,MT2); c.hline(5,0,31,MT3)
    c.hline(11,0,31,MT2); c.hline(12,0,31,MT3)
    for vx in [8,16,24]:
        c.vline(vx,0,15,MT2)
    # Rivet dots
    for rx in [2,10,18,26]:
        for ry in [2,7,13]:
            c.put(rx,ry,MT3)
    c.hline(0,0,31,MT3); c.hline(15,0,31,OL)

    c.render('platform_starwars.png', pixel_size=2)


# ── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    print('Generating backgrounds...')
    bg_seiya()
    bg_hogwarts()
    bg_pokemon()
    bg_starwars()

    print('Generating sprites...')
    sprite_player_seiya()
    sprite_player_saga()
    sprite_player_harry()
    sprite_player_ash()
    sprite_player_anakin()
    sprite_enemy_seiya()
    sprite_enemy_dementor()
    sprite_enemy_pokemon('fire')
    sprite_enemy_pokemon('leaf')
    sprite_enemy_pokemon('wing')
    sprite_coin()
    sprite_orb_hp()
    sprite_pokeball()

    print('Generating platform tiles...')
    tile_platform_seiya()
    tile_platform_hogwarts()
    tile_platform_pokemon()
    tile_platform_starwars()

    print('Done! All assets saved to frontend/public/assets/')

if __name__ == '__main__':
    main()
