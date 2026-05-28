"""
성동구 카페 리스트를 카카오 로컬 API로 수집해 Workspace에 bulk_create.
usage: python manage.py fetch_cafes
"""
import os
import time
import requests
from django.core.management.base import BaseCommand
from spaces.models import Workspace

# 성동구 격자 분할 bounding box (좌하단 ~ 우상단 lng,lat)
# 성동구 전체: 127.017 ~ 127.075 / 37.535 ~ 37.570
# 3×2 격자로 분할해 API 최대 45건 제한 우회
GRID = [
    (127.017, 37.535, 127.037, 37.553),
    (127.037, 37.535, 127.057, 37.553),
    (127.057, 37.535, 127.075, 37.553),
    (127.017, 37.553, 127.037, 37.570),
    (127.037, 37.553, 127.057, 37.570),
    (127.057, 37.553, 127.075, 37.570),
]

KAKAO_URL = "https://dapi.kakao.com/v2/local/search/category.json"


class Command(BaseCommand):
    help = "성동구 카페 리스트를 카카오 로컬 API로 수집"

    def handle(self, *args, **options):
        api_key = os.environ.get("KAKAO_REST_API_KEY")
        if not api_key:
            self.stderr.write("KAKAO_REST_API_KEY 환경변수가 없습니다.")
            return

        headers = {"Authorization": f"KakaoAK {api_key}"}
        collected = {}  # place_id → dict 중복 제거

        for idx, (x1, y1, x2, y2) in enumerate(GRID, 1):
            self.stdout.write(f"[{idx}/{len(GRID)}] 격자 ({x1},{y1}) ~ ({x2},{y2}) 수집 중...")
            page = 1
            while True:
                params = {
                    "category_group_code": "CE7",
                    "rect": f"{x1},{y1},{x2},{y2}",
                    "page": page,
                    "size": 15,
                }
                resp = requests.get(KAKAO_URL, headers=headers, params=params, timeout=10)
                if resp.status_code != 200:
                    self.stderr.write(f"  API 오류 {resp.status_code}: {resp.text[:200]}")
                    break

                data = resp.json()
                documents = data.get("documents", [])
                for doc in documents:
                    collected[doc["id"]] = {
                        "name": doc["place_name"],
                        "address": doc.get("road_address_name") or doc.get("address_name", ""),
                        "latitude": float(doc["y"]),
                        "longitude": float(doc["x"]),
                    }

                meta = data.get("meta", {})
                if meta.get("is_end") or not documents:
                    break
                page += 1
                time.sleep(0.3)

            time.sleep(0.5)

        self.stdout.write(f"\n총 {len(collected)}개 카페 수집 완료. DB 저장 중...")

        existing_names = set(Workspace.objects.values_list("name", flat=True))
        new_workspaces = [
            Workspace(**info)
            for info in collected.values()
            if info["name"] not in existing_names
        ]
        Workspace.objects.bulk_create(new_workspaces, batch_size=200)

        self.stdout.write(self.style.SUCCESS(
            f"신규 {len(new_workspaces)}개 저장 완료 (기존 {len(existing_names)}개 스킵)"
        ))
