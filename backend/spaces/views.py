from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from .models import Workspace
from .serializers import WorkspaceSerializer


class WorkspaceFilter(FilterSet):
    min_score_plug = NumberFilter(field_name="score_plug", lookup_expr="gte")
    min_score_wifi = NumberFilter(field_name="score_wifi", lookup_expr="gte")
    min_score_noise = NumberFilter(field_name="score_noise", lookup_expr="gte")
    min_score_comfort = NumberFilter(field_name="score_comfort", lookup_expr="gte")
    min_score_table = NumberFilter(field_name="score_table", lookup_expr="gte")

    class Meta:
        model = Workspace
        fields = ["min_score_plug", "min_score_wifi", "min_score_noise",
                  "min_score_comfort", "min_score_table"]


class WorkspaceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Workspace.objects.filter(last_scored_at__isnull=False).order_by("id")
    serializer_class = WorkspaceSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = WorkspaceFilter
    ordering_fields = ["score_plug", "score_wifi", "score_noise", "score_comfort", "score_table", "name"]
    ordering = ["-score_plug"]
