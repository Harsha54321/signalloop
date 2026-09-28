"""
SignalLoop procedural level generator.

The puzzle: a grid of tiles, each tile is a "circuit piece" with 1-4 open
sides (N/E/S/W). Every tile starts rotated randomly. The player clicks a
tile to rotate it 90 degrees clockwise. The level is solved when every
tile is rotated back to its original ("solved") orientation, which is the
exact moment every circuit piece lines up with its neighbours into one
single connected network with zero dangling ends and zero broken links.

Levels are generated procedurally and are UNLIMITED - level_number can be
any positive integer. Generation is deterministic per level_number (same
seed => same puzzle every time), and difficulty (grid size, extra loops,
number of scrambled tiles) scales up as level_number grows.

IMPORTANT: this file has an exact twin in JavaScript at
frontend/src/utils/levelGenerator.js. Both use the same hash + the same
PRNG (mulberry32) so a given level number produces the *identical* puzzle
in the browser (offline) and on the server. If you change one, change
the other.

Algorithm:
1. Build a random spanning tree over the grid cells using randomized
   Prim's algorithm -> guarantees every cell is reachable (always solvable).
2. For higher levels, sprinkle in extra edges to create loops -> harder,
   still always solvable.
3. Each cell's "solved shape" = the set of absolute directions (N/E/S/W)
   in which it connects to a neighbour.
4. Scramble each tile with a random rotation offset (1-3 steps) so the
   board starts unsolved.
"""

DIRS = ["N", "E", "S", "W"]  # clockwise order
OPPOSITE = {"N": "S", "S": "N", "E": "W", "W": "E"}
DELTA = {"N": (-1, 0), "S": (1, 0), "E": (0, 1), "W": (0, -1)}

M32 = 0xFFFFFFFF


def _imul(a: int, b: int) -> int:
    """32-bit integer multiply (same as JavaScript's Math.imul, unsigned)."""
    return (a * b) & M32


def _hash_seed(text: str) -> int:
    """FNV-1a 32-bit hash of an ASCII string."""
    h = 0x811C9DC5
    for byte in text.encode("ascii"):
        h ^= byte
        h = _imul(h, 0x01000193)
    return h


class SeededRNG:
    """mulberry32 PRNG - tiny, fast, and trivially identical in JS."""

    def __init__(self, seed: int):
        self.state = seed & M32

    def random(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & M32
        t = self.state
        t = _imul(t ^ (t >> 15), t | 1)
        t = ((t + _imul(t ^ (t >> 7), t | 61)) & M32) ^ t
        return ((t ^ (t >> 14)) & M32) / 4294967296

    def randrange(self, n: int) -> int:
        return int(self.random() * n)

    def choice(self, items):
        return items[int(self.random() * len(items))]

    def shuffle(self, items) -> None:
        """In-place Fisher-Yates shuffle."""
        for i in range(len(items) - 1, 0, -1):
            j = int(self.random() * (i + 1))
            items[i], items[j] = items[j], items[i]


def _seed_for_level(level_number: int) -> int:
    return _hash_seed(f"signalloop-level-{level_number}")


def _grid_dims(level_number: int):
    """Grid grows slowly with level number, capping out so boards stay
    playable, then difficulty keeps rising via loops/scramble instead."""
    size = 3 + (level_number - 1) // 4
    size = min(size, 10)
    return size, size


def _extra_loop_count(level_number: int, total_cells: int) -> int:
    """How many extra (non-tree) connections to add, creating loops and
    tiles with more open sides -> more rotation states -> harder."""
    base = (level_number - 1) // 3
    return min(base, total_cells // 3)


def rotate_edges(edges, steps: int):
    """Rotate a set of absolute directions clockwise by `steps` * 90deg."""
    steps = steps % 4
    return {DIRS[(DIRS.index(d) + steps) % 4] for d in edges}


def shape_name(edges) -> str:
    n = len(edges)
    if n == 0:
        return "isolated"
    if n == 1:
        return "end"
    if n == 2:
        a, b = list(edges)
        return "straight" if OPPOSITE[a] == b else "corner"
    if n == 3:
        return "tee"
    return "cross"


def generate_level(level_number: int) -> dict:
    if level_number < 1:
        raise ValueError("level_number must be >= 1")

    rng = SeededRNG(_seed_for_level(level_number))

    rows, cols = _grid_dims(level_number)
    total_cells = rows * cols

    # --- 1. Randomized Prim's algorithm to build a spanning tree ---
    connections = {(r, c): set() for r in range(rows) for c in range(cols)}
    visited = set()
    start = (rng.randrange(rows), rng.randrange(cols))
    visited.add(start)

    frontier = []  # list of (cell, direction, neighbour) edges leaving the visited set

    def add_frontier(cell):
        r, c = cell
        for d in DIRS:
            dr, dc = DELTA[d]
            nb = (r + dr, c + dc)
            if 0 <= nb[0] < rows and 0 <= nb[1] < cols and nb not in visited:
                frontier.append((cell, d, nb))

    add_frontier(start)

    while len(visited) < total_cells:
        rng.shuffle(frontier)
        cell, d, nb = frontier.pop()
        if nb in visited:
            continue
        connections[cell].add(d)
        connections[nb].add(OPPOSITE[d])
        visited.add(nb)
        add_frontier(nb)
        # drop any now-stale entries pointing at cells already visited
        frontier = [f for f in frontier if f[2] not in visited]

    # --- 2. Add extra edges to create loops for higher difficulty ---
    extra = _extra_loop_count(level_number, total_cells)
    all_pairs = []
    for r in range(rows):
        for c in range(cols):
            if c + 1 < cols:
                all_pairs.append(((r, c), "E", (r, c + 1)))
            if r + 1 < rows:
                all_pairs.append(((r, c), "S", (r + 1, c)))
    rng.shuffle(all_pairs)

    added = 0
    for cell, d, nb in all_pairs:
        if added >= extra:
            break
        if d in connections[cell]:
            continue  # already connected
        # cap tile connectivity so it never becomes a visually useless
        # 4-open "always solved" tile too often
        if len(connections[cell]) >= 3 or len(connections[nb]) >= 3:
            continue
        connections[cell].add(d)
        connections[nb].add(OPPOSITE[d])
        added += 1

    # --- 3. Build cell data with solved shape + scrambled rotation ---
    cells = []
    par_total = 0  # minimum number of taps needed to solve the whole board
    for r in range(rows):
        for c in range(cols):
            solved_edges = connections[(r, c)]
            name = shape_name(solved_edges)

            # how many distinct rotations actually look different
            if name == "straight":
                period = 2
            elif name == "cross":
                period = 1
            else:
                period = 4

            if period == 1:
                rotation = 0
            else:
                rotation = rng.choice(list(range(1, period)))

            # taps this tile needs to get back to its solved orientation
            par_total += 0 if period == 1 else (period - rotation) % period

            cells.append(
                {
                    "row": r,
                    "col": c,
                    "shape": sorted(solved_edges, key=DIRS.index),
                    "rotation": rotation,
                }
            )

    difficulty = 1 + (level_number - 1) // 4 + (1 if extra else 0)

    return {
        "level_number": level_number,
        "rows": rows,
        "cols": cols,
        "difficulty": difficulty,
        "extra_loops": extra,
        "par_moves": max(par_total, 1),
        "cells": cells,
    }
