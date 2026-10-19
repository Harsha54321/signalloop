from django.db import migrations, models


class Migration(migrations.Migration):
    """Turns PlayerProgress into a multi-game table.

    Existing SignalLoop rows keep working: they get game="signalloop" and an
    empty variant, so the new unique key (player, game, variant, level) is
    satisfied by every existing row.
    """

    dependencies = [
        ("game", "0002_gamerating"),
    ]

    operations = [
        migrations.AddField(
            model_name="playerprogress",
            name="game",
            field=models.CharField(default="signalloop", max_length=32),
        ),
        migrations.AddField(
            model_name="playerprogress",
            name="variant",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="playerprogress",
            name="best_score",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="playerprogress",
            name="best_extra",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterUniqueTogether(
            name="playerprogress",
            unique_together={("player_id", "game", "variant", "level_number")},
        ),
    ]
