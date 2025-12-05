from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GroupViewSet, MemberViewSet, ReceiptViewSet

router = DefaultRouter()
router.register(r'groups', GroupViewSet)
router.register(r'members', MemberViewSet)
router.register(r'receipts', ReceiptViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
