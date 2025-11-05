from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Sum
from .models import (
    MenuCategory, MenuItem, MenuItemEmbedding,
    RestaurantTable, Order, OrderItem, RestaurantConversation, TableStatistics
)


@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'client', 'sort_order', 'is_active', 'items_count', 'icon']
    list_filter = ['client', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['client', 'sort_order', 'name']
    
    @admin.display(description='Items')
    def items_count(self, obj):
        return obj.items.count()
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not getattr(request.user, "is_superuser", False):
            qs = qs.filter(client__user=request.user)
        return qs.annotate(items_count=Count('items'))


class MenuItemAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'client', 'price_display', 
        'is_available', 'chef_recommendation', 'popular_item',
        'calories', 'spicy_level'
    ]
    list_filter = [
        'client', 'category', 'is_available', 
        'chef_recommendation', 'popular_item',
        'dietary_labels', 'allergens', 'spicy_level'
    ]
    search_fields = ['name', 'description', 'ingredients']
    ordering = ['client', 'category', 'sort_order', 'name']
    readonly_fields = ['created_at', 'updated_at', 'image_preview']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('client', 'category', 'name', 'name_translations', 
                      'description', 'description_translations', 'sort_order')
        }),
        ('Pricing', {
            'fields': ('price', 'discount_price', 'currency')
        }),
        ('Media', {
            'fields': ('image', 'image_preview', 'image_url')
        }),
        ('Nutritional Information', {
            'fields': ('calories', 'proteins', 'fats', 'carbs'),
            'classes': ('collapse',)
        }),
        ('Dietary & Allergens', {
            'fields': ('allergens', 'dietary_labels', 'spicy_level')
        }),
        ('Details', {
            'fields': ('ingredients', 'cooking_time', 'wine_pairing'),
            'classes': ('collapse',)
        }),
        ('Recommendations', {
            'fields': ('chef_recommendation', 'popular_item', 'tags')
        }),
        ('Availability', {
            'fields': ('is_available', 'available_from', 'available_until', 'stock_quantity')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    @admin.display(description='Price')
    def price_display(self, obj):
        if obj.discount_price:
            return format_html(
                '<s>{}</s> <b>{}</b> {}',
                obj.price, obj.discount_price, obj.currency
            )
        return f"{obj.price} {obj.currency}"
    
    @admin.display(description='Preview')
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 200px;" />',
                obj.image.url
            )
        elif obj.image_url:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 200px;" />',
                obj.image_url
            )
        return "No image"
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not getattr(request.user, "is_superuser", False):
            qs = qs.filter(client__user=request.user)
        return qs.select_related('category', 'client')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "category":
            if not getattr(request.user, "is_superuser", False):
                kwargs["queryset"] = MenuCategory.objects.filter(
                    client__user=request.user
                )
        elif db_field.name == "client":
            if not getattr(request.user, "is_superuser", False):
                from MASTER.clients.models import Client
                kwargs["queryset"] = Client.objects.filter(
                    client_type='restaurant',
                    is_active=True
                )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(MenuItem)
class MenuItemInlineAdmin(MenuItemAdmin):
    pass


@admin.register(RestaurantTable)
class RestaurantTableAdmin(admin.ModelAdmin):
    list_display = [
        'table_number', 'display_name', 'client', 'capacity',
        'location', 'is_active', 'is_occupied', 'conversations_count', 'qr_code_preview'
    ]
    list_filter = ['client', 'is_active', 'is_occupied', 'location']
    search_fields = ['table_number', 'display_name', 'location']
    ordering = ['client', 'table_number']
    readonly_fields = ['access_token', 'qr_code_preview', 'qr_code_url', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('client', 'table_number', 'display_name', 'capacity', 'location')
        }),
        ('QR Code', {
            'fields': ('qr_code', 'qr_code_preview', 'qr_code_url', 'access_token')
        }),
        ('Status', {
            'fields': ('is_active', 'is_occupied')
        }),
        ('Additional', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    @admin.display(description='QR Preview')
    def qr_code_preview(self, obj):
        if obj.qr_code:
            return format_html(
                '<img src="{}" style="max-height: 150px; max-width: 150px;" />',
                obj.qr_code.url
            )
        return "No QR code generated"
    
    @admin.display(description='Conversations')
    def conversations_count(self, obj):
        count = obj.get_conversations_count()
        active_count = obj.get_active_conversations_count()
        return format_html(
            '{} total ({} active)',
            count, active_count
        )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not getattr(request.user, "is_superuser", False):
            qs = qs.filter(client__user=request.user)
        return qs.select_related('client')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "client":
            if not getattr(request.user, "is_superuser", False):
                from MASTER.clients.models import Client
                kwargs["queryset"] = Client.objects.filter(
                    client_type='restaurant',
                    is_active=True
                )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']
    fields = ['menu_item', 'quantity', 'unit_price', 'total_price', 'notes', 'is_ready']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number', 'table_display', 'client', 'status',
        'total_amount', 'customer_name', 'created_at'
    ]
    list_filter = ['status', 'client', 'created_at', 'table']
    search_fields = ['order_number', 'customer_name', 'customer_phone', 'customer_email']
    ordering = ['-created_at']
    readonly_fields = [
        'order_number', 'subtotal', 'total_amount',
        'created_at', 'confirmed_at', 'ready_at', 'served_at', 'paid_at'
    ]
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('client', 'table', 'order_number', 'status')
        }),
        ('Customer Information', {
            'fields': ('customer_name', 'customer_phone', 'customer_email', 'customer_language')
        }),
        ('Financial', {
            'fields': ('subtotal', 'tax_amount', 'discount_amount', 'total_amount')
        }),
        ('Special Requests', {
            'fields': ('special_requests',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'confirmed_at', 'ready_at', 'served_at', 'paid_at'),
            'classes': ('collapse',)
        }),
        ('Integration', {
            'fields': ('pos_order_id', 'webhook_sent', 'webhook_response'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_confirmed', 'mark_preparing', 'mark_ready', 'mark_served', 'mark_paid']
    
    @admin.display(description='Table')
    def table_display(self, obj):
        if obj.table:
            return f"Table {obj.table.table_number}"
        return "No table"
    
    @admin.action(description="Mark selected orders as confirmed")
    def mark_confirmed(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(
            status=Order.STATUS_CONFIRMED,
            confirmed_at=timezone.now()
        )
        self.message_user(request, f"{updated} orders marked as confirmed.")
    
    @admin.action(description="Mark selected orders as preparing")
    def mark_preparing(self, request, queryset):
        updated = queryset.update(status=Order.STATUS_PREPARING)
        self.message_user(request, f"{updated} orders marked as preparing.")
    
    @admin.action(description="Mark selected orders as ready")
    def mark_ready(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(
            status=Order.STATUS_READY,
            ready_at=timezone.now()
        )
        self.message_user(request, f"{updated} orders marked as ready.")
    
    @admin.action(description="Mark selected orders as served")
    def mark_served(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(
            status=Order.STATUS_SERVED,
            served_at=timezone.now()
        )
        self.message_user(request, f"{updated} orders marked as served.")
    
    @admin.action(description="Mark selected orders as paid")
    def mark_paid(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(
            status=Order.STATUS_PAID,
            paid_at=timezone.now()
        )
        self.message_user(request, f"{updated} orders marked as paid.")
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not getattr(request.user, "is_superuser", False):
            qs = qs.filter(client__user=request.user)
        return qs.select_related('client', 'table').prefetch_related('items__menu_item')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "client":
            if not getattr(request.user, "is_superuser", False):
                from MASTER.clients.models import Client
                kwargs["queryset"] = Client.objects.filter(
                    client_type='restaurant',
                    is_active=True
                )
        elif db_field.name == "table":
            if not getattr(request.user, "is_superuser", False):
                kwargs["queryset"] = RestaurantTable.objects.filter(
                    client__user=request.user
                )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(RestaurantConversation)
class RestaurantConversationAdmin(admin.ModelAdmin):
    list_display = [
        'customer_phone', 'client', 'table', 'total_messages', 
        'is_active', 'started_at', 'ended_at'
    ]
    list_filter = ['client', 'is_active', 'started_at', 'ended_at', 'language']
    search_fields = ['customer_phone', 'session_id']
    ordering = ['-started_at']
    readonly_fields = [
        'total_messages', 'started_at', 'ended_at', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Conversation Information', {
            'fields': ('client', 'table', 'customer_phone', 'session_id', 'language')
        }),
        ('Messages', {
            'fields': ('messages', 'total_messages'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'started_at', 'ended_at')
        }),
        ('Metadata', {
            'fields': ('context_metadata', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_inactive', 'end_conversations']
    
    @admin.action(description="Mark selected conversations as inactive")
    def mark_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} conversations marked as inactive.")
    
    @admin.action(description="End selected conversations")
    def end_conversations(self, request, queryset):
        from django.utils import timezone
        updated = 0
        for conv in queryset:
            conv.end_conversation()
            updated += 1
        self.message_user(request, f"{updated} conversations ended.")
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not getattr(request.user, "is_superuser", False):
            qs = qs.filter(client__user=request.user)
        return qs.select_related('client', 'table')


@admin.register(TableStatistics)
class TableStatisticsAdmin(admin.ModelAdmin):
    list_display = [
        'table', 'date', 'total_conversations', 'total_messages',
        'total_duration_hours', 'unique_customers'
    ]
    list_filter = ['date', 'table__client', 'table']
    search_fields = ['table__table_number', 'table__client__company_name']
    ordering = ['-date', 'table']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Statistics Information', {
            'fields': ('table', 'date')
        }),
        ('Daily Metrics', {
            'fields': (
                'total_conversations', 'total_messages', 
                'total_duration_hours', 'unique_customers'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['recalculate_statistics']
    
    @admin.action(description="Recalculate statistics for selected records")
    def recalculate_statistics(self, request, queryset):
        updated = 0
        for stats in queryset:
            TableStatistics.calculate_for_table(stats.table, stats.date)
            updated += 1
        self.message_user(request, f"Recalculated statistics for {updated} records.")
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not getattr(request.user, "is_superuser", False):
            qs = qs.filter(table__client__user=request.user)
        return qs.select_related('table', 'table__client')


@admin.register(MenuItemEmbedding)
class MenuItemEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['menu_item', 'embedding_model', 'language', 'created_at']
    list_filter = ['embedding_model', 'language', 'created_at']
    search_fields = ['menu_item__name', 'content']
    readonly_fields = ['vector', 'created_at']