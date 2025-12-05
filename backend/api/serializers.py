from rest_framework import serializers
from .models import Group, Member, Receipt, ReceiptSplit

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'group', 'name', 'pin', 'joined_at']
        extra_kwargs = {'pin': {'write_only': True}}

class ReceiptSplitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptSplit
        fields = ['member', 'weight']

class ReceiptSerializer(serializers.ModelSerializer):
    splits = ReceiptSplitSerializer(many=True, read_only=True)
    payer_id = serializers.PrimaryKeyRelatedField(source='payer', queryset=Member.objects.all(), write_only=True)
    split_data = serializers.ListField(child=serializers.DictField(), write_only=True)

    class Meta:
        model = Receipt
        fields = ['id', 'group', 'payer', 'payer_id', 'total', 'image', 'created_at', 'splits', 'split_data']
        read_only_fields = ['payer']

    def create(self, validated_data):
        split_data = validated_data.pop('split_data')
        receipt = Receipt.objects.create(**validated_data)
        
        for split in split_data:
            ReceiptSplit.objects.create(receipt=receipt, member_id=split['member_id'], weight=split.get('weight', 1.0))
            
        return receipt

class GroupSerializer(serializers.ModelSerializer):
    members = MemberSerializer(many=True, read_only=True)
    receipts = ReceiptSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'public_id', 'name', 'pin', 'created_at', 'members', 'receipts']
