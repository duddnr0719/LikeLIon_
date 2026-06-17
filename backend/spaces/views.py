from rest_framework import viewsets, mixins
from rest_framework.filters import OrderingFilter
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from .models import Workspace, SpaceReview
from .serializers import WorkspaceSerializer, SpaceReviewSerializer


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


class SpaceReviewViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = SpaceReviewSerializer

    def get_workspace(self):
        workspace_pk = self.kwargs["workspace_pk"]
        try:
            return Workspace.objects.get(pk=workspace_pk)
        except Workspace.DoesNotExist:
            raise NotFound(f"workspace {workspace_pk}를 찾을 수 없습니다.")

    def get_queryset(self):
        return SpaceReview.objects.filter(workspace=self.get_workspace()).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(workspace=self.get_workspace())
