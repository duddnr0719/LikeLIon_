from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Workspace(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=500)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)

    # 카공족 5대 지표 (prompt_rule.md 기준)
    score_plug = models.FloatField(null=True, blank=True)
    score_wifi = models.FloatField(null=True, blank=True)
    score_noise = models.FloatField(null=True, blank=True)
    score_comfort = models.FloatField(null=True, blank=True)
    score_table = models.FloatField(null=True, blank=True)  # 0.0 or 5.0

    total_review_count = models.PositiveIntegerField(default=0)
    last_scored_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name


class CafeReviewRaw(models.Model):
    SOURCE_CHOICES = [
        ('naver_place', '네이버 플레이스'),
        ('naver_blog', '네이버 블로그'),
    ]
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='raw_reviews')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    text = models.TextField()
    url = models.URLField(max_length=1000, blank=True)
    crawled_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.workspace.name} [{self.source}] {self.crawled_at.date()}"


class SpaceReview(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='reviews')
    author = models.CharField(max_length=100)
    rating_infrastructure = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    rating_atmosphere = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    rating_furniture = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    rating_comfort = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.workspace.name} - {self.author} ({self.created_at.date()})"
