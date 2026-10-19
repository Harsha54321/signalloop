from django.contrib import admin
from .models import PlayerProgress, GameRating


@admin.register(PlayerProgress)
class PlayerProgressAdmin(admin.ModelAdmin):
    list_display = (
        "player_id", "game", "variant", "level_number", "completed",
        "stars", "best_score", "best_moves", "best_time_seconds",
    )
    list_filter = ("game", "completed", "stars")
    search_fields = ("player_id",)


@admin.register(GameRating)
class GameRatingAdmin(admin.ModelAdmin):
    list_display = ("player_id", "stars", "comment", "updated_at")
    list_filter = ("stars",)
    search_fields = ("player_id", "comment")
