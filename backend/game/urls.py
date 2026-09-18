from django.urls import path
from . import views

urlpatterns = [
    path("level/<int:level_number>/", views.level_detail, name="level-detail"),
    path("progress/<str:player_id>/", views.progress_list, name="progress-list"),
    path("progress/", views.submit_result, name="submit-result"),
    path("leaderboard/<int:level_number>/", views.leaderboard, name="leaderboard"),
    path("rating/", views.submit_rating, name="submit-rating"),
    path("rating/summary/", views.rating_summary, name="rating-summary"),
    path("rating/<str:player_id>/", views.my_rating, name="my-rating"),
]
