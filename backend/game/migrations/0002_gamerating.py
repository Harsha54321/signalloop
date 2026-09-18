from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("game", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="GameRating",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("player_id", models.CharField(db_index=True, max_length=64)),
                ("stars", models.PositiveSmallIntegerField()),
                ("comment", models.CharField(blank=True, default="", max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-updated_at"],
            },
        ),
    ]
