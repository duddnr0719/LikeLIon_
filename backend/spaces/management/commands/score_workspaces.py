"""
CafeReviewRaw 원문을 L40 추론 서버로 보내 Workspace 5대 지표 점수화.
usage: python manage.py score_workspaces [--limit N] [--force]
"""
import os
import time
import requests
from django.core.management.base import BaseCommand
from django.utils import timezone
from spaces.models import Workspace, CafeReviewRaw

SCORE_SERVER_URL = os.environ.get("SCORE_SERVER_URL", "http://100.66.16.106:8001/score")


class Command(BaseCommand):
    help = "L40 Qwen 서버로 카페별 리뷰 점수화"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=0, help="처리할 카페 수 (0=전체)")
        parser.add_argument("--force", action="store_true", help="이미 점수화된 카페도 재처리")

    def handle(self, *args, **options):
        qs = Workspace.objects.all().order_by("id")
        if not options["force"]:
            qs = qs.filter(last_scored_at__isnull=True)
        if options["limit"]:
            qs = qs[:options["limit"]]

        total = qs.count()
        if total == 0:
            self.stdout.write("점수화할 카페가 없습니다. --force 옵션으로 재처리 가능.")
            return

        self.stdout.write(f"총 {total}개 카페 점수화 시작 (서버: {SCORE_SERVER_URL})\n")
        success, failed = 0, 0

        for idx, workspace in enumerate(qs, 1):
            reviews = list(
                CafeReviewRaw.objects.filter(workspace=workspace)
                .values_list("text", flat=True)
            )

            if not reviews:
                self.stdout.write(f"[{idx}/{total}] {workspace.name} — 리뷰 없음, 스킵")
                continue

            self.stdout.write(f"[{idx}/{total}] {workspace.name} ({len(reviews)}건) 점수화 중...")

            try:
                resp = requests.post(
                    SCORE_SERVER_URL,
                    json={"cafe_name": workspace.name, "reviews": reviews},
                    timeout=180,
                )
                resp.raise_for_status()
                data = resp.json()

                workspace.score_plug = data.get("score_plug")
                workspace.score_wifi = data.get("score_wifi")
                workspace.score_noise = data.get("score_noise")
                workspace.score_comfort = data.get("score_comfort")
                workspace.score_table = data.get("score_table")
                workspace.total_review_count = data.get("total_review_count", len(reviews))
                workspace.last_scored_at = timezone.now()
                workspace.save(update_fields=[
                    "score_plug", "score_wifi", "score_noise",
                    "score_comfort", "score_table",
                    "total_review_count", "last_scored_at",
                ])
                self.stdout.write(
                    f"  → plug={data.get('score_plug')} wifi={data.get('score_wifi')} "
                    f"noise={data.get('score_noise')} comfort={data.get('score_comfort')} "
                    f"table={data.get('score_table')}"
                )
                success += 1

            except requests.exceptions.RequestException as e:
                self.stderr.write(f"  → 요청 실패: {e}")
                failed += 1
            except Exception as e:
                self.stderr.write(f"  → 오류: {e}")
                failed += 1

            time.sleep(0.2)

        self.stdout.write(self.style.SUCCESS(
            f"\n완료: 성공 {success}개 / 실패 {failed}개 / 전체 {total}개"
        ))
