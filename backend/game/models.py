from django.db import models


class PlayerProgress(models.Model):
    """One row per (player, game, variant, level) - stores the best result.

    `player_id` is a random id generated client-side and stored in the
    browser's localStorage, so no login/signup is required.

    * game          - "signalloop" (default) or one of the arcade-hub games
                      ("wordhunt", "memory", "neonstack", "stardodger").
    * variant       - theme / world inside a game (e.g. "animals", "ocean").
                      Empty for SignalLoop.
    * level_number  - level inside the variant. 0 for single-run arcade games.
    * best_score    - best score (new games). SignalLoop leaves it empty.
    * best_extra    - game specific best secondary stat: tower floors for
                      Neon Stack, stars collected for Star Dodger, words
                      found for Word Hunt.
    """

    player_id = models.CharField(max_length=64, db_index=True)
    game = models.CharField(max_length=32, default="signalloop")
    variant = models.CharField(max_length=32, blank=True, default="")
    level_number = models.PositiveIntegerField()
    best_score = models.PositiveIntegerField(null=True, blank=True)
    best_extra = models.PositiveIntegerField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    best_moves = models.PositiveIntegerField(null=True, blank=True)
    best_time_seconds = models.FloatField(null=True, blank=True)
    stars = models.PositiveSmallIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("player_id", "game", "variant", "level_number")
        ordering = ["level_number"]

    def __str__(self):
        return f"{self.player_id} - {self.game}/{self.variant or '-'} level {self.level_number} ({self.stars}*)"


class GameRating(models.Model):
    """A player's overall rating/review of the game itself (not a level).
    Powers the in-app 'Rate this game' page."""

    player_id = models.CharField(max_length=64, db_index=True)
    stars = models.PositiveSmallIntegerField()  # 1-5
    comment = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.player_id} rated {self.stars}*"
