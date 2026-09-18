from django.db import models


class PlayerProgress(models.Model):
    """One row per (player, level) - stores best result for that level.
    `player_id` is a random UUID string generated client-side and stored
    in the browser's localStorage, so no login/signup is required.
    """

    player_id = models.CharField(max_length=64, db_index=True)
    level_number = models.PositiveIntegerField()
    completed = models.BooleanField(default=False)
    best_moves = models.PositiveIntegerField(null=True, blank=True)
    best_time_seconds = models.FloatField(null=True, blank=True)
    stars = models.PositiveSmallIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("player_id", "level_number")
        ordering = ["level_number"]

    def __str__(self):
        return f"{self.player_id} - level {self.level_number} ({self.stars}*)"


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
