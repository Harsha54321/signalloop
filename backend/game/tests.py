from django.test import TestCase
from .level_generator import generate_level, rotate_edges, DELTA, OPPOSITE


class LevelGeneratorTests(TestCase):
    def test_levels_are_deterministic(self):
        a = generate_level(42)
        b = generate_level(42)
        self.assertEqual(a, b)

    def test_edges_are_mutually_consistent_and_connected(self):
        for level_number in [1, 3, 10, 25, 77, 300]:
            data = generate_level(level_number)
            rows, cols = data["rows"], data["cols"]
            grid = {(c["row"], c["col"]): c for c in data["cells"]}

            for (r, c), cell in grid.items():
                for d in cell["shape"]:
                    dr, dc = DELTA[d]
                    nr, nc = r + dr, c + dc
                    self.assertTrue(0 <= nr < rows and 0 <= nc < cols)
                    neighbour = grid[(nr, nc)]
                    self.assertIn(OPPOSITE[d], neighbour["shape"])

            # connectivity check via BFS over the solved shape graph
            seen = {(0, 0)}
            stack = [(0, 0)]
            while stack:
                r, c = stack.pop()
                for d in grid[(r, c)]["shape"]:
                    dr, dc = DELTA[d]
                    nb = (r + dr, c + dc)
                    if nb not in seen:
                        seen.add(nb)
                        stack.append(nb)
            self.assertEqual(len(seen), rows * cols)

    def test_difficulty_scales_up(self):
        early = generate_level(1)
        late = generate_level(200)
        self.assertGreaterEqual(late["rows"] * late["cols"], early["rows"] * early["cols"])
        self.assertGreater(late["difficulty"], early["difficulty"])

    def test_par_moves_is_the_true_minimum_number_of_taps(self):
        """Perfect play must be able to earn 3 stars, so par has to equal the
        minimum taps needed (each tile needs 0-3 taps, not always 1)."""
        for level_number in [1, 7, 30, 250]:
            data = generate_level(level_number)
            optimal = 0
            for cell in data["cells"]:
                shape = set(cell["shape"])
                optimal += next(
                    t for t in range(4) if rotate_edges(shape, cell["rotation"] + t) == shape
                )
            self.assertEqual(data["par_moves"], max(optimal, 1))
