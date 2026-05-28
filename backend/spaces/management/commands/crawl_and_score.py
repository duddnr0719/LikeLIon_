"""
증분 크롤링 + 재점수화 통합 커맨드 (주 1회 크론용)
- 신규 리뷰가 생긴 카페만 재점수화
usage: python manage.py crawl_and_score
"""
import os
import time
import requests
from django.core.management.base import BaseCommand
from django.utils import timezone
from spaces.models import Workspace, CafeReviewRaw

NAVER_BLOG_URL = "https://openapi.naver.com/v1/search/blog.json"
SCORE_SERVER_URL = os.environ.get("SCORE_SERVER_URL", "http://100.66.16.106:8001/score")


def fetch_naver_blog(query, client_id, client_secret, display=10):
    headers = {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
    }
    params = {"query": query, "display": display, "sort": "date"}
    resp = requests.get(NAVER_BLOG_URL, headers=headers, params=params, timeout=10)
    if resp.status_code != 200:
        return []
    return [
        {
            "text": (item.get("description") or "").replace("<b>", "").replace("</b>", ""),
            "url": item.get("link", ""),
        }
        for item in resp.json().get("items", [])
        if item.get("description")
    ]


class Command(BaseCommand):
    help = "증분 크롤링 후 변경된 카페만 재점수화 (주 1회 크론용)"

    def handle(self, *args, **options):
        client_id = os.environ.get("NAVER_CLIENT_ID")
        client_secret = os.environ.get("NAVER_CLIENT_SECRET")
        if not client_id or not client_secret:
            self.stderr.write("NAVER API 키가 없습니다.")
            return

        workspaces = Workspace.objects.all().order_by("id")
        total = workspaces.count()
        updated_workspaces = []

        self.stdout.write(f"[1단계] 증분 크롤링 ({total}개 카페)...")
        for idx, workspace in enumerate(workspaces, 1):
            existing_urls = set(
                CafeReviewRaw.objects.filter(workspace=workspace, source="naver_blog")
                .values_list("url", flat=True)
            )
            new_raws, seen_urls = [], set(existing_urls)

            for query in [f"{workspace.name} 카공", f"{workspace.name} 노트북"]:
                for item in fetch_naver_blog(query, client_id, client_secret):
                    if item["url"] not in seen_urls and item["text"].strip():
                        new_raws.append(CafeReviewRaw(
                            workspace=workspace, source="naver_blog",
                            text=item["text"], url=item["url"],
                        ))
                        seen_urls.add(item["url"])
                time.sleep(0.5)

            if new_raws:
                CafeReviewRaw.objects.bulk_create(new_raws, batch_size=100)
                updated_workspaces.append(workspace)
                self.stdout.write(f"  [{idx}/{total}] {workspace.name} +{len(new_raws)}건")

            time.sleep(0.3)

        self.stdout.write(f"\n[2단계] 재점수화 ({len(updated_workspaces)}개 카페)...")
        success, failed = 0, 0

        for workspace in updated_workspaces:
            reviews = list(
                CafeReviewRaw.objects.filter(workspace=workspace).values_list("text", flat=True)
            )
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
                success += 1
            except Exception as e:
                self.stderr.write(f"  {workspace.name} 점수화 실패: {e}")
                failed += 1
            time.sleep(0.2)

        self.stdout.write(self.style.SUCCESS(
            f"\n완료: 신규 리뷰 {len(updated_workspaces)}개 카페 / 점수화 성공 {success}개 / 실패 {failed}개"
        ))
