import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("spaces", "0003_workspace_kakao_place_id_workspace_kakao_url_and_more"),
    ]

    operations = [
        migrations.RemoveField(model_name="spacereview", name="author"),
        migrations.RemoveField(model_name="spacereview", name="rating_infrastructure"),
        migrations.RemoveField(model_name="spacereview", name="rating_atmosphere"),
        migrations.RemoveField(model_name="spacereview", name="rating_furniture"),
        migrations.RemoveField(model_name="spacereview", name="rating_comfort"),
        migrations.AddField(
            model_name="spacereview",
            name="score_plug",
            field=models.FloatField(
                default=3.0,
                validators=[
                    django.core.validators.MinValueValidator(1),
                    django.core.validators.MaxValueValidator(5),
                ],
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="spacereview",
            name="score_wifi",
            field=models.FloatField(
                default=3.0,
                validators=[
                    django.core.validators.MinValueValidator(1),
                    django.core.validators.MaxValueValidator(5),
                ],
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="spacereview",
            name="score_noise",
            field=models.FloatField(
                default=3.0,
                validators=[
                    django.core.validators.MinValueValidator(1),
                    django.core.validators.MaxValueValidator(5),
                ],
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="spacereview",
            name="score_comfort",
            field=models.FloatField(
                default=3.0,
                validators=[
                    django.core.validators.MinValueValidator(1),
                    django.core.validators.MaxValueValidator(5),
                ],
            ),
            preserve_default=False,
        ),
    ]
