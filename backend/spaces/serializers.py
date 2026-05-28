from rest_framework import serializers
from .models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = [
            "id", "name", "address", "latitude", "longitude",
            "score_plug", "score_wifi", "score_noise", "score_comfort", "score_table",
            "total_review_count", "last_scored_at",
        ]
