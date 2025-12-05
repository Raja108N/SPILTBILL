from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Group, Member, Receipt
from .serializers import GroupSerializer, MemberSerializer, ReceiptSerializer

from django.shortcuts import get_object_or_404
import logging
import traceback

logger = logging.getLogger(__name__)

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    def create(self, request, *args, **kwargs):
        try:
            # When creating a group, we also create the admin member with the same PIN
            response = super().create(request, *args, **kwargs)
            group_id = response.data['id']
            pin = request.data.get('pin')
            creator_name = request.data.get('creator_name', 'Admin') 
            
            # Create the admin member
            Member.objects.create(group_id=group_id, name=creator_name, pin=pin, is_admin=True)
            
            # Refresh data to include the new member
            group = Group.objects.get(id=group_id)
            serializer = self.get_serializer(group)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            with open('backend_debug.log', 'a') as f:
                f.write(f"Error creating group: {e}\n")
                f.write(traceback.format_exc())
            raise e

    @action(detail=False, methods=['post'], url_path='join/(?P<public_id>[^/.]+)')
    def join_group(self, request, public_id=None):
        # Custom action to join by public_id
        group = get_object_or_404(Group, public_id=public_id)
        name = request.data.get('name')
        pin = request.data.get('pin')
        
        if not name or not pin:
            return Response({'error': 'Name and PIN are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if member exists
        member = group.members.filter(name__iexact=name).first()
        
        if member:
            # Login: Verify PIN
            if member.pin == pin:
                serializer = self.get_serializer(group)
                return Response({
                    'group': serializer.data,
                    'member_id': member.id,
                    'is_admin': member.is_admin,
                    'message': 'Logged in successfully'
                })
            else:
                return Response({'error': 'Incorrect PIN for this user'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            # Register: Create new member
            member = Member.objects.create(group=group, name=name, pin=pin)
            serializer = self.get_serializer(group)
            return Response({
                'group': serializer.data,
                'member_id': member.id,
                'is_admin': member.is_admin,
                'message': 'Joined group successfully'
            })

    @action(detail=True, methods=['patch'])
    def update_public_id(self, request, pk=None):
        group = self.get_object()
        member_id = request.data.get('member_id')
        new_public_id = request.data.get('public_id')

        if not member_id or not new_public_id:
            return Response({'error': 'Member ID and New Public ID required'}, status=status.HTTP_400_BAD_REQUEST)

        member = group.members.filter(id=member_id).first()
        if not member or not member.is_admin:
            return Response({'error': 'Only admins can update Group ID'}, status=status.HTTP_403_FORBIDDEN)

        if Group.objects.filter(public_id=new_public_id).exists():
             return Response({'error': 'This Group ID is already taken'}, status=status.HTTP_400_BAD_REQUEST)

        group.public_id = new_public_id
        group.save()
        return Response({'message': 'Group ID updated successfully', 'public_id': new_public_id})

    @action(detail=False, methods=['get'], url_path='public/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        group = get_object_or_404(Group, public_id=public_id)
        serializer = self.get_serializer(group)
        return Response(serializer.data)

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer

class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer
