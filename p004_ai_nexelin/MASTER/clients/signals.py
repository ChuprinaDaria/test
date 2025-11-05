from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Client


@receiver(post_save, sender=Client)
def regenerate_table_qrs_on_logo_change(sender, instance: Client, created, **kwargs):
    """Regenerates QR codes for all tables when client logo changes"""
    # Check if this is a restaurant
    if instance.client_type != 'restaurant':
        return
    
    # If creating new client with logo or updating logo
    if created and instance.logo:
        # New client with logo - regenerate
        pass
    elif not created and 'logo' in (kwargs.get('update_fields') or []):
        # Logo update - regenerate
        pass
    else:
        # Other cases - don't regenerate
        return
    
    # Check if Celery is available
    try:
        from .tasks import regenerate_qrs_for_client_task
        # Call asynchronously via Celery
        client_id = getattr(instance, 'id', None)
        if client_id:
            regenerate_qrs_for_client_task.delay(client_id)
            print(f"Celery task started for client {client_id}")
    except ImportError:
        # If Celery is not available - do synchronously
        client_id = getattr(instance, 'id', None)
        print(f"Regenerating QR synchronously for client {client_id}")
        try:
            from MASTER.restaurant.models import RestaurantTable
            tables = RestaurantTable.objects.filter(client=instance)
            for table in tables:
                try:
                    table.generate_qr_code()
                    table.save(update_fields=["qr_code"])
                    print(f"QR regenerated for table {table.table_number}")
                except Exception as e:
                    print(f"Error regenerating QR code for table {table.table_number}: {e}")
        except ImportError:
            print("Restaurant app not available")
