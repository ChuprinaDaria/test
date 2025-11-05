from rest_framework import serializers
from MASTER.clients.models import Client, ClientDocument, ClientAPIKey, KnowledgeBlock, ClientQRCode


class ClientSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id',
            'user',
            'branch',
            'branch_name',
            'specialization',
            'specialization_name',
            'company_name',
            'tag',
            'description',
            'api_key',
            'logo',
            'logo_url',
            'is_active',
            'client_type',
            'features',
            'custom_system_prompt',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['api_key', 'created_by', 'created_at', 'updated_at']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    


class ClientDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientDocument
        fields = '__all__'


class ClientAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientAPIKey
        fields = '__all__'


class KnowledgeBlockSerializer(serializers.ModelSerializer):
    entries_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = KnowledgeBlock
        fields = [
            'id',
            'client',
            'name',
            'description',
            'is_active',
            'is_permanent',
            'entries_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['client', 'is_permanent', 'entries_count', 'created_at', 'updated_at']


class ClientQRCodeSerializer(serializers.ModelSerializer):
    qr_code_url_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ClientQRCode
        fields = [
            'id',
            'client',
            'name',
            'description',
            'location',
            'qr_code',
            'qr_code_url',
            'qr_code_url_display',
            'qr_token',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['client', 'qr_token', 'qr_code_url', 'created_at', 'updated_at']
    
    def get_qr_code_url_display(self, obj):
        """Returns QR code image URL"""
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            return obj.qr_code.url
        return None

