from rest_framework.routers import DefaultRouter
from .views import WorkspaceViewSet

router = DefaultRouter()
router.register(r"spaces", WorkspaceViewSet, basename="workspace")

urlpatterns = router.urls
