"""
카카오 키워드 검색 API로 DB 카페의 추가 정보(place_id, phone, kakao_url)를 업데이트.
usage: python manage.py enrich_cafes [--limit N] [--force]
"""
import os
import time
import requests
from django.core.management.base import BaseCommand
from spaces.models import Workspace

KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"


def search_kakao_place(name, address, api_key):
    """카페 이름 + 주소(시/구 부분)로 카카오 장소 검색, 첫 번째 결과 반환"""
    # 주소에서 '구' 단위까지만 추출해 검색 정확도 향상
    addr_parts = address.split()
    district = " ".join(addr_parts[:2]) if len(addr_parts) >= 2 else address

    headers = {"Authorization": f"KakaoAK {api_key}"}
    params = {
        "query": name,
        "size": 5,
    }
    try:
        resp = requests.get(KAKAO_KEYWORD_URL, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        documents = resp.json().get("documents", [])
    except requests.exceptions.RequestException:
        return None

    # 이름이 정확히 일치하는 결과 우선, 없으면 첫 번째
    for doc in documents:
        if doc.get("place_name") == name:
            return doc
    return documents[0] if documents else None


class Command(BaseCommand):
    help = "카카오 API로 카페 추가 정보(place_id, phone, url) 업데이트"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=0, help="처리할 카페 수 (0=전체)")
        parser.add_argument("--force", action="store_true", help="이미 enrich된 카페도 재처리")

    def handle(self, *args, **options):
        api_key = os.environ.get("KAKAO_REST_API_KEY")
        if not api_key:
            self.stderr.write("KAKAO_REST_API_KEY 환경변수가 없습니다.")
            return

        qs = Workspace.objects.all().order_by("id")
        if not options["force"]:
            qs = qs.filter(kakao_place_id__isnull=True)
        if options["limit"]:
            qs = qs[: options["limit"]]

        total = qs.count()
        if total == 0:
            self.stdout.write("처리할 카페가 없습니다. --force 옵션으로 재처리 가능.")
            return

        self.stdout.write(f"총 {total}개 카페 enrich 시작...\n")
        success, failed, skipped = 0, 0, 0

        for idx, workspace in enumerate(qs, 1):
            self.stdout.write(f"[{idx}/{total}] {workspace.name} 검색 중...")

            doc = search_kakao_place(workspace.name, workspace.address, api_key)
            if doc is None:
                self.stdout.write(f"  → 검색 결과 없음")
                skipped += 1
                time.sleep(0.5)
                continue

            try:
                workspace.kakao_place_id = doc.get("id", "")
                workspace.phone = doc.get("phone", "")
                workspace.kakao_url = doc.get("place_url", "")
                workspace.save(update_fields=["kakao_place_id", "phone", "kakao_url"])
                self.stdout.write(
                    f"  → id={workspace.kakao_place_id} "
                    f"phone={workspace.phone or '없음'}"
                )
                success += 1
            except Exception as e:
                self.stderr.write(f"  → 저장 실패: {e}")
                failed += 1

            time.sleep(0.5)

        self.stdout.write(self.style.SUCCESS(
            f"\n완료: 성공 {success}개 / 결과없음 {skipped}개 / 실패 {failed}개 / 전체 {total}개"
        ))
