from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Group, Member, Receipt, ReceiptSplit
from decimal import Decimal
from django.db.models import Sum
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
    
    def _calculate_nets(self, group):
        members = group.members.all()
        receipts = group.receipts.all()
        
        nets = {m.id: Decimal('0.00') for m in members}
        
        for receipt in receipts:
            if receipt.payer.id in nets:
                nets[receipt.payer.id] += receipt.total
            
            splits = receipt.splits.all()
            if splits.exists():
                total_weight = sum(s.weight for s in splits)
                if total_weight > 0:
                    for split in splits:
                        share = (receipt.total * Decimal(str(split.weight))) / Decimal(str(total_weight))
                        if split.member.id in nets:
                            nets[split.member.id] -= share
        
        return nets

    @action(detail=True, methods=['get'])
    def balances(self, request, pk=None):
        group = self.get_object()
        nets = self._calculate_nets(group)
        # Convert Decimals to float for JSON response
        return Response({str(k): float(v.quantize(Decimal('0.01'))) for k, v in nets.items()})

    @action(detail=True, methods=['get'])
    def settlements(self, request, pk=None):
        group = self.get_object()
        nets = self._calculate_nets(group)
        member_names = {m.id: m.name for m in group.members.all()}

        # 2. Separate into Debtors and Creditors
        debtors = []
        creditors = []

        for m_id, amount in nets.items():
            # Round to 2 decimals
            amount = amount.quantize(Decimal('0.01'))
            if amount < 0:
                debtors.append({'id': m_id, 'amount': amount})
            elif amount > 0:
                creditors.append({'id': m_id, 'amount': amount})

        # 3. Sort by magnitude (descending)
        # Debtors: most negative first (smallest number) -> Ascending sort works for negative numbers to get largest magnitude? 
        # No, -26 is smaller than -6. We want -26 first. So sort ascending is correct for negatives.
        debtors.sort(key=lambda x: x['amount']) 
        
        # Creditors: largest positive first -> Descending sort
        creditors.sort(key=lambda x: x['amount'], reverse=True)

        # 4. Greedy Settlement
        settlements_list = []
        i = 0
        j = 0

        while i < len(debtors) and j < len(creditors):
            debtor = debtors[i]
            creditor = creditors[j]

            # Amount to pay is min of abs(debt) and credit
            amount = min(abs(debtor['amount']), creditor['amount'])
            
            # Avoid zero transactions
            if amount > 0:
                settlements_list.append({
                    'from': debtor['id'],
                    'from_name': member_names.get(debtor['id'], 'Unknown'),
                    'to': creditor['id'],
                    'to_name': member_names.get(creditor['id'], 'Unknown'),
                    'amount': float(amount) # Convert back to float for JSON
                })

            # Update balances
            debtor['amount'] += amount
            creditor['amount'] -= amount

            # Check if settled (using small epsilon for Decimal comparison not strictly needed if quantized, but good practice)
            if abs(debtor['amount']) < Decimal('0.01'):
                i += 1
            if abs(creditor['amount']) < Decimal('0.01'):
                j += 1
        
        return Response(settlements_list)


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
