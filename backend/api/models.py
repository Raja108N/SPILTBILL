from django.db import models
import uuid

class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    public_id = models.CharField(max_length=100, unique=True, blank=True) # Editable ID, defaults to UUID
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    pin = models.CharField(max_length=4, default='0000')

    def save(self, *args, **kwargs):
        if not self.public_id:
            self.public_id = str(self.id) if self.id else str(uuid.uuid4())
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Member(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, related_name='members', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    pin = models.CharField(max_length=4, default='0000')
    is_admin = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.group.name})"

class Receipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, related_name='receipts', on_delete=models.CASCADE)
    payer = models.ForeignKey(Member, related_name='paid_receipts', on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='receipts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.total} by {self.payer.name}"

class ReceiptSplit(models.Model):
    receipt = models.ForeignKey(Receipt, related_name='splits', on_delete=models.CASCADE)
    member = models.ForeignKey(Member, related_name='receipt_splits', on_delete=models.CASCADE)
    weight = models.FloatField(default=1.0)
