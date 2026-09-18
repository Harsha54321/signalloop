from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from django.db.models import Avg, Count

from .level_generator import generate_level
from .models import PlayerProgress, GameRating
from .serializers import PlayerProgressSerializer, SubmitResultSerializer, GameRatingSerializer


@api_view(["GET"])
def level_detail(request, level_number: int):
    """Returns a freshly (deterministically) generated puzzle layout for
    any level number >= 1. There is no upper bound - levels are infinite."""
    try:
        data = generate_level(level_number)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(data)


def _stars_for(moves: int, par_moves: int) -> int:
    if moves <= par_moves:
        return 3
    if moves <= par_moves * 1.5:
        return 2
    return 1


@api_view(["GET"])
def progress_list(request, player_id: str):
    qs = PlayerProgress.objects.filter(player_id=player_id).order_by("level_number")
    return Response(PlayerProgressSerializer(qs, many=True).data)


@api_view(["POST"])
def submit_result(request):
    serializer = SubmitResultSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data

    level_data = generate_level(payload["level_number"])
    stars = _stars_for(payload["moves"], level_data["par_moves"])

    obj, _created = PlayerProgress.objects.get_or_create(
        player_id=payload["player_id"],
        level_number=payload["level_number"],
    )

    is_better = (
        obj.best_moves is None
        or payload["moves"] < obj.best_moves
        or stars > obj.stars
    )

    obj.completed = True
    if is_better:
        obj.best_moves = payload["moves"]
        obj.best_time_seconds = payload["time_seconds"]
        obj.stars = stars
    obj.save()

    return Response(PlayerProgressSerializer(obj).data, status=status.HTTP_200_OK)


@api_view(["GET"])
def leaderboard(request, level_number: int):
    """Top 10 fastest completions for a given level, across all players."""
    qs = (
        PlayerProgress.objects.filter(level_number=level_number, completed=True)
        .exclude(best_time_seconds=None)
        .order_by("best_time_seconds")[:10]
    )
    data = [
        {
            "player_id": p.player_id[:8],
            "best_time_seconds": p.best_time_seconds,
            "best_moves": p.best_moves,
            "stars": p.stars,
        }
        for p in qs
    ]
    return Response(data)


@api_view(["POST"])
def submit_rating(request):
    """Player rates the game overall (1-5 stars + optional comment).
    One rating per player - resubmitting updates the existing one."""
    serializer = GameRatingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data

    obj, _created = GameRating.objects.update_or_create(
        player_id=payload["player_id"],
        defaults={
            "stars": payload["stars"],
            "comment": payload.get("comment", ""),
        },
    )
    return Response(GameRatingSerializer(obj).data, status=status.HTTP_200_OK)


@api_view(["GET"])
def rating_summary(request):
    """Average game rating + total number of ratings, plus the most
    recent comments, for the 'Rate this game' page."""
    agg = GameRating.objects.aggregate(average=Avg("stars"), count=Count("id"))
    recent = GameRating.objects.exclude(comment="").order_by("-updated_at")[:10]
    return Response(
        {
            "average": round(agg["average"], 2) if agg["average"] else 0,
            "count": agg["count"] or 0,
            "recent_comments": [
                {"stars": r.stars, "comment": r.comment} for r in recent
            ],
        }
    )


@api_view(["GET"])
def my_rating(request, player_id: str):
    obj = GameRating.objects.filter(player_id=player_id).first()
    if not obj:
        return Response(None)
    return Response(GameRatingSerializer(obj).data)
