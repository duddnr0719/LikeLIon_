"""
성동구 카페별 네이버 블로그 리뷰를 수집해 CafeReviewRaw에 저장.
usage: python manage.py crawl_reviews [--limit N]
"""
import os
import time
import requests
from django.core.management.base import BaseCommand
from spaces.models import Workspace, CafeReviewRaw

NAVER_BLOG_URL = "https://openapi.naver.com/v1/search/blog.json"


def fetch_naver_blog(query, client_id, client_secret, display=20):
    headers = {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
    }
    params = {"query": query, "display": display, "sort": "date"}
    resp = requests.get(NAVER_BLOG_URL, headers=headers, params=params, timeout=10)
    if resp.status_code != 200:
        return []
    items = resp.json().get("items", [])
    return [
        {
            "text": (item.get("description") or "").replace("<b>", "").replace("</b>", ""),
            "url": item.get("link", ""),
        }
        for item in items
        if item.get("description")
    ]


class Command(BaseCommand):
    help = "카페별 네이버 블로그 리뷰 수집"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=0, help="처리할 카페 수 (0=전체)")

    def handle(self, *args, **options):
        client_id = os.environ.get("NAVER_CLIENT_ID")
        client_secret = os.environ.get("NAVER_CLIENT_SECRET")
        if not client_id or not client_secret:
            self.stderr.write("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 없습니다.")
            return

        qs = Workspace.objects.all().order_by("id")
        limit = options["limit"]
        if limit:
            qs = qs[:limit]

        total = qs.count()
        saved = 0

        for idx, workspace in enumerate(qs, 1):
            self.stdout.write(f"[{idx}/{total}] {workspace.name} 크롤링 중...")

            # 이미 수집된 URL 중복 방지
            existing_urls = set(
                CafeReviewRaw.objects.filter(workspace=workspace, source="naver_blog")
                .values_list("url", flat=True)
            )

            queries = [f"{workspace.name} 카공", f"{workspace.name} 노트북"]
            new_raws = []
            seen_urls = set(existing_urls)

            for query in queries:
                items = fetch_naver_blog(query, client_id, client_secret, display=10)
                for item in items:
                    if item["url"] not in seen_urls and item["text"].strip():
                        new_raws.append(CafeReviewRaw(
                            workspace=workspace,
                            source="naver_blog",
                            text=item["text"],
                            url=item["url"],
                        ))
                        seen_urls.add(item["url"])
                time.sleep(0.5)

            if new_raws:
                CafeReviewRaw.objects.bulk_create(new_raws, batch_size=100)
                saved += len(new_raws)
                self.stdout.write(f"  → {len(new_raws)}건 저장")
            else:
                self.stdout.write("  → 신규 리뷰 없음")

            time.sleep(0.5)

        self.stdout.write(self.style.SUCCESS(f"\n완료: 총 {saved}건 저장 ({total}개 카페 처리)"))
