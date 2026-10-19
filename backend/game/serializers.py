from rest_framework import serializers
from .models import PlayerProgress, GameRating


class PlayerProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerProgress
        fields = [
            "id",
            "player_id",
            "game",
            "variant",
            "level_number",
            "completed",
            "best_moves",
            "best_time_seconds",
            "best_score",
            "best_extra",
            "stars",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


# Games that report their own score/stars (the server can't recompute them
# the way it does for SignalLoop). SignalLoop keeps using /progress/.
SCORE_GAMES = ("wordhunt", "memory", "neonstack", "stardodger")


class SubmitScoreSerializer(serializers.Serializer):
    player_id = serializers.CharField(max_length=64)
    game = serializers.ChoiceField(choices=SCORE_GAMES)
    variant = serializers.RegexField(
        r"^[a-z0-9_-]{0,32}$", allow_blank=True, required=False, default=""
    )
    level_number = serializers.IntegerField(min_value=0, max_value=1_000_000, default=0)
    score = serializers.IntegerField(min_value=0, max_value=10_000_000)
    stars = serializers.IntegerField(min_value=0, max_value=3, default=0)
    moves = serializers.IntegerField(min_value=0, max_value=1_000_000, default=0)
    time_seconds = serializers.FloatField(min_value=0, max_value=1_000_000, default=0)
    extra = serializers.IntegerField(min_value=0, max_value=1_000_000, default=0)


class SubmitResultSerializer(serializers.Serializer):
    player_id = serializers.CharField(max_length=64)
    level_number = serializers.IntegerField(min_value=1)
    moves = serializers.IntegerField(min_value=0)
    time_seconds = serializers.FloatField(min_value=0)


class GameRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameRating
        fields = ["id", "player_id", "stars", "comment", "updated_at"]
        read_only_fields = ["id", "updated_at"]

    def validate_stars(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("stars must be between 1 and 5")
        return value
