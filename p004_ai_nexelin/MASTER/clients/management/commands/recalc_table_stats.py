from django.core.management.base import BaseCommand
from MASTER.restaurant.models import RestaurantTable, TableStatistics
from django.utils import timezone
from datetime import date, datetime


class Command(BaseCommand):
    help = "Recalculate table statistics for all tables"

    def add_arguments(self, parser):
        parser.add_argument("--date", type=str, help="Specific date to recalculate (YYYY-MM-DD)")
        parser.add_argument("--table-id", type=int, help="Specific table ID to recalculate")

    def handle(self, *args, **opts):
        self.stdout.write(self.style.SUCCESS("Starting table statistics recalculation..."))
        
        # Визначаємо дату
        if opts.get("date"):
            target_date = datetime.strptime(opts["date"], "%Y-%m-%d").date()
        else:
            target_date = date.today()
        
        # Визначаємо столики
        if opts.get("table_id"):
            tables = RestaurantTable.objects.filter(id=opts["table_id"])
            self.stdout.write(f"Recalculating for table ID: {opts['table_id']}")
        else:
            tables = RestaurantTable.objects.all()
            self.stdout.write(f"Recalculating for all tables on {target_date}")
        
        total_processed = 0
        
        for table in tables:
            self.stdout.write(f"Processing table {table.table_number} (ID: {table.pk})...")
            
            try:
                # Видаляємо існуючу статистику за цю дату
                TableStatistics.objects.filter(table=table, date=target_date).delete()
                
                # Перераховуємо статистику
                stats = TableStatistics.calculate_for_table(table, target_date)
                
                if stats:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✅ Generated stats for table {table.table_number}: "
                            f"{stats.total_conversations} conversations, "
                            f"{stats.total_messages} messages, "
                            f"{stats.total_duration_hours:.1f} hours"
                        )
                    )
                    total_processed += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f"⚠️ No data for table {table.table_number} on {target_date}")
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Error processing table {table.table_number}: {e}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully processed {total_processed} tables")
        )
