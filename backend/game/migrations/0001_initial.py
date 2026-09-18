from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="PlayerProgress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("player_id", models.CharField(db_index=True, max_length=64)),
                ("level_number", models.PositiveIntegerField()),
                ("completed", models.BooleanField(default=False)),
                ("best_moves", models.PositiveIntegerField(blank=True, null=True)),
                ("best_time_seconds", models.FloatField(blank=True, null=True)),
                ("stars", models.PositiveSmallIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["level_number"],
            },
        ),
        migrations.AlterUniqueTogether(
            name="playerprogress",
            unique_together={("player_id", "level_number")},
        ),
    ]
