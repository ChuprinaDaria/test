from django.core.management.base import BaseCommand
from MASTER.restaurant.models import RestaurantTable


class Command(BaseCommand):
    help = "Regenerate QR codes for tables"

    def add_arguments(self, parser):
        parser.add_argument("--client-id", type=int, help="Regenerate QR codes for specific client")
        parser.add_argument("--table-id", type=int, help="Regenerate QR code for specific table")

    def handle(self, *args, **opts):
        qs = RestaurantTable.objects.all()
        
        if opts.get("client_id"):
            qs = qs.filter(client_id=opts["client_id"])
            self.stdout.write(f"Filtering by client ID: {opts['client_id']}")
            
        if opts.get("table_id"):
            qs = qs.filter(id=opts["table_id"])
            self.stdout.write(f"Filtering by table ID: {opts['table_id']}")
        
        total_count = qs.count()
        self.stdout.write(f"Found {total_count} table(s) to process")
        
        n = 0
        for table in qs:
            try:
                self.stdout.write(f"Processing table {table.table_number} (ID: {table.id})...")
                table.generate_qr_code()
                table.save(update_fields=["qr_code"])
                n += 1
                self.stdout.write(f"✅ Generated QR for table {table.table_number}")
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Error processing table {table.table_number}: {e}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully regenerated {n} QR code(s) out of {total_count}")
        )
