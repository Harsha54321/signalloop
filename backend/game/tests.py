import json

from django.test import TestCase
from .level_generator import generate_level, rotate_edges, DELTA, OPPOSITE
from .models import PlayerProgress


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


class MultiGameApiTests(TestCase):
    """Score based games (Word Hunt, Memory Match, Neon Stack, Star Dodger)
    share the PlayerProgress table with SignalLoop."""

    def post(self, path, body):
        return self.client.post(path, data=json.dumps(body), content_type="application/json")

    def score(self, **overrides):
        body = {
            "player_id": "player-a",
            "game": "neonstack",
            "variant": "neon-city",
            "level_number": 0,
            "score": 300,
            "stars": 2,
            "moves": 0,
            "time_seconds": 40.5,
            "extra": 22,
        }
        body.update(overrides)
        return self.post("/api/score/", body)

    def test_score_is_saved(self):
        res = self.score()
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["game"], "neonstack")
        self.assertEqual(data["variant"], "neon-city")
        self.assertEqual(data["best_score"], 300)
        self.assertEqual(data["best_extra"], 22)
        self.assertEqual(PlayerProgress.objects.count(), 1)

    def test_worse_run_never_lowers_the_saved_best(self):
        self.score(score=500, stars=3, extra=30)
        res = self.score(score=100, stars=1, extra=5)
        data = res.json()
        self.assertEqual(data["best_score"], 500)
        self.assertEqual(data["stars"], 3)
        self.assertEqual(data["best_extra"], 30)
        self.assertEqual(PlayerProgress.objects.count(), 1)

    def test_better_run_replaces_score_and_keeps_best_stars(self):
        self.score(score=100, stars=3, extra=10)
        data = self.score(score=900, stars=1, extra=40).json()
        self.assertEqual(data["best_score"], 900)
        self.assertEqual(data["stars"], 3)
        self.assertEqual(data["best_extra"], 40)

    def test_unknown_game_and_bad_values_are_rejected(self):
        self.assertEqual(self.score(game="signalloop").status_code, 400)
        self.assertEqual(self.score(game="nope").status_code, 400)
        self.assertEqual(self.score(stars=4).status_code, 400)
        self.assertEqual(self.score(score=-1).status_code, 400)
        self.assertEqual(self.score(variant="Bad Variant!").status_code, 400)
        self.assertEqual(PlayerProgress.objects.count(), 0)

    def test_same_level_number_in_different_games_does_not_collide(self):
        # SignalLoop level 3, Word Hunt level 3 and Memory level 3 for one player
        self.post("/api/progress/", {
            "player_id": "player-a", "level_number": 3, "moves": 20, "time_seconds": 30,
        })
        self.score(game="wordhunt", variant="animals", level_number=3, score=700, stars=3)
        self.score(game="memory", variant="fruits", level_number=3, score=650, stars=2)
        self.assertEqual(PlayerProgress.objects.filter(level_number=3).count(), 3)

    def test_progress_defaults_to_signalloop_and_all_returns_everything(self):
        self.post("/api/progress/", {
            "player_id": "player-a", "level_number": 1, "moves": 20, "time_seconds": 30,
        })
        self.score()
        default_rows = self.client.get("/api/progress/player-a/").json()
        self.assertEqual([r["game"] for r in default_rows], ["signalloop"])
        all_rows = self.client.get("/api/progress/player-a/?game=all").json()
        self.assertEqual(sorted(r["game"] for r in all_rows), ["neonstack", "signalloop"])
        arcade_rows = self.client.get("/api/progress/player-a/?game=neonstack").json()
        self.assertEqual(len(arcade_rows), 1)

    def test_score_leaderboard_orders_by_score_and_filters_by_variant(self):
        self.score(player_id="aaaa1111", score=200)
        self.score(player_id="bbbb2222", score=900)
        self.score(player_id="cccc3333", score=500)
        self.score(player_id="dddd4444", score=9999, variant="sunset")  # other world
        rows = self.client.get("/api/scores/neonstack/?variant=neon-city&level=0").json()
        self.assertEqual([r["best_score"] for r in rows], [900, 500, 200])
        self.assertEqual(rows[0]["player_id"], "bbbb2222")

    def test_score_leaderboard_rejects_unknown_game(self):
        self.assertEqual(self.client.get("/api/scores/signalloop/").status_code, 404)
        self.assertEqual(self.client.get("/api/scores/neonstack/?level=abc").status_code, 400)

    def test_signalloop_leaderboard_ignores_other_games(self):
        self.post("/api/progress/", {
            "player_id": "player-a", "level_number": 0 + 1, "moves": 20, "time_seconds": 30,
        })
        self.score(game="wordhunt", variant="animals", level_number=1, score=100, time_seconds=1)
        rows = self.client.get("/api/leaderboard/1/").json()
        self.assertEqual(len(rows), 1)
