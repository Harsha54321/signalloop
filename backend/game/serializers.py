from rest_framework import serializers
from .models import PlayerProgress, GameRating


class PlayerProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerProgress
        fields = [
            "id",
            "player_id",
            "level_number",
            "completed",
            "best_moves",
            "best_time_seconds",
            "stars",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


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
