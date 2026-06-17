from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import WorkspaceViewSet, SpaceReviewViewSet

router = DefaultRouter()
router.register(r"spaces", WorkspaceViewSet, basename="workspace")

review_list_create = SpaceReviewViewSet.as_view({"get": "list", "post": "create"})

urlpatterns = router.urls + [
    path("spaces/<int:workspace_pk>/reviews/", review_list_create, name="space-reviews"),
]
