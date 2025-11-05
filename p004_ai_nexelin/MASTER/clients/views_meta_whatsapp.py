from django.views import View
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
from django.utils import timezone

import json, hmac, hashlib, logging, requests, base64
from urllib.parse import unquote

from .models import Client, ClientQRCode, ClientWhatsAppConversation
from MASTER.restaurant.models import RestaurantTable, RestaurantConversation

logger = logging.getLogger(__name__)

GRAPH_URL = "https://graph.facebook.com/v23.0"

def verify_xhub_signature(raw_body: bytes, x_hub_signature_256: str, app_secret: str) -> bool:
    try:
        expected = 'sha256=' + hmac.new(
            app_secret.encode('utf-8'),
            msg=raw_body,
            digestmod=hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, x_hub_signature_256)
    except Exception as e:
        logger.error("Signature verification error: %s", e, exc_info=True)
        return False

def send_whatsapp_text(to_number: str, body: str) -> bool:
    """Відправляє повідомлення через Meta WhatsApp API"""
    try:
        url = f"{GRAPH_URL}/{settings.META_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {settings.META_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": body, "preview_url": False}
        }
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        logger.info(f"Meta WhatsApp message sent successfully to {to_number}")
        return True
    except Exception as e:
        logger.error(f"Failed to send Meta WhatsApp message: {str(e)}", exc_info=True)
        return False

@method_decorator(csrf_exempt, name='dispatch')
class MetaWhatsAppWebhookView(View):
    """
    Webhook для обробки повідомлень від Meta WhatsApp Business API
    """
    
    def get(self, request, *args, **kwargs):
        """Верифікація webhook для Meta"""
        mode = request.GET.get("hub.mode")
        token = request.GET.get("hub.verify_token")
        challenge = request.GET.get("hub.challenge")
        if mode == "subscribe" and token == settings.META_VERIFY_TOKEN:
            logger.info("Meta WhatsApp webhook verified successfully")
            return HttpResponse(challenge)
        logger.warning(f"Meta WhatsApp webhook verification failed: mode={mode}, token_match={token == settings.META_VERIFY_TOKEN}")
        return HttpResponse(status=403)

    def post(self, request, *args, **kwargs):
        """Обробка вхідних повідомлень від Meta"""
        try:
            # Перевірка підпису
            raw_body = request.body
            x_hub_signature = request.headers.get('X-Hub-Signature-256', '')
            
            if x_hub_signature and settings.META_APP_SECRET:
                if not verify_xhub_signature(raw_body, x_hub_signature, settings.META_APP_SECRET):
                    logger.warning("Invalid Meta webhook signature")
                    return HttpResponse(status=403)
            
            body = json.loads(raw_body.decode("utf-8"))
            logger.info(f"Meta WhatsApp Webhook POST: {json.dumps(body, indent=2)}")
            
            # Meta відправляє події в полі 'entry'
            if 'object' in body and body['object'] == 'whatsapp_business_account':
                for entry in body.get('entry', []):
                    for change in entry.get('changes', []):
                        value = change.get('value', {})
                        
                        # Обробка статусів (доставка, прочитано) - пропускаємо
                        if 'statuses' in value:
                            continue
                        
                        # Обробка повідомлень
                        if 'messages' in value:
                            for message in value['messages']:
                                self.handle_message(message, value.get('metadata', {}))
            
            return HttpResponse(status=200)
            
        except Exception as e:
            logger.error(f"Error processing Meta webhook: {str(e)}", exc_info=True)
            return HttpResponse(status=500)
    
    def handle_message(self, message, metadata):
        """Обробляє одне повідомлення від Meta"""
        try:
            from_number = message.get('from', '')
            message_type = message.get('type', '')
            message_id = message.get('id', '')
            
            # Отримуємо текст повідомлення
            message_body = ''
            if message_type == 'text':
                message_body = message.get('text', {}).get('body', '')
            elif message_type == 'interactive':
                # Обробка кнопок/меню
                interactive = message.get('interactive', {})
                if 'button_reply' in interactive:
                    message_body = interactive['button_reply'].get('title', '')
                elif 'list_reply' in interactive:
                    message_body = interactive['list_reply'].get('title', '')
            else:
                logger.info(f"Unsupported message type: {message_type}")
                return
            
            if not message_body:
                logger.warning(f"Empty message body for message {message_id}")
                return
            
            logger.info(f"Processing Meta message: from={from_number}, type={message_type}, body={message_body[:100]}")
            
            # Перевіряємо чи це START2 команда
            if message_body.strip().upper().startswith('START2'):
                self.handle_start2_command(from_number, message_body)
            else:
                self.handle_regular_message(from_number, message_body)
                
        except Exception as e:
            logger.error(f"Error handling Meta message: {str(e)}", exc_info=True)
    
    def handle_start2_command(self, from_number, message_body):
        """Обробляє START2 команду (аналогічно Twilio)"""
        try:
            logger.info(f"Processing START2 command: {message_body}")
            
            parts = message_body.split()
            ref_data = None
            table_number = None
            signature = None
            
            for part in parts[1:]:  # Пропускаємо 'START2'
                if part.startswith('ref='):
                    ref_data = part[4:]
                elif part.startswith('tbl='):
                    table_number = part[4:]
                elif part.startswith('sig='):
                    signature = part[4:]
            
            logger.info(f"Parsed START2: ref={ref_data}, tbl={table_number}, sig={signature}")
            
            if not all([ref_data, table_number, signature]):
                logger.warning(f"Invalid START2 format: {message_body}")
                send_whatsapp_text(from_number, "Невірний формат команди START2")
                return
            
            # Перевіряємо підпис
            if not self.verify_signature(ref_data, table_number, signature):
                logger.warning(f"Invalid signature for START2: {message_body}")
                send_whatsapp_text(from_number, "Невірний підпис команди")
                return
            
            # Декодуємо ref_data
            try:
                if not ref_data:
                    raise ValueError("ref_data is empty")
                ref_data += '=' * (4 - len(ref_data) % 4)
                decoded = base64.urlsafe_b64decode(ref_data).decode('utf-8')
                branch_slug, specialization_slug, client_token = decoded.split('~')
            except Exception as e:
                logger.error(f"Failed to decode ref_data: {e}")
                send_whatsapp_text(from_number, "Невірні дані в команді")
                return
            
            # Знаходимо клієнта за токеном
            logger.info(f"Looking for client with token: {client_token}")
            try:
                client = Client.objects.get(api_keys__key=client_token, api_keys__is_active=True)
                logger.info(f"Found client: {client.company_name}")
            except Client.DoesNotExist:
                logger.warning(f"Client not found for token: {client_token}")
                send_whatsapp_text(from_number, "Клієнт не знайдено")
                return
            
            # Шукаємо QR код або стіл
            qr_code = None
            table = None
            
            try:
                qr_code = ClientQRCode.objects.get(
                    client=client,
                    qr_token=table_number,
                    is_active=True
                )
                logger.info(f"Found ClientQRCode: {qr_code.name}")
            except ClientQRCode.DoesNotExist:
                try:
                    table = RestaurantTable.objects.get(
                        client=client,
                        table_number=table_number,
                        is_active=True
                    )
                    logger.info(f"Found RestaurantTable: {table.table_number}")
                except RestaurantTable.DoesNotExist:
                    logger.warning(f"QR code or table not found: {table_number}")
                    send_whatsapp_text(from_number, "QR код або стіл не знайдено")
                    return
            
            # Створюємо або оновлюємо розмову
            conversation, created = ClientWhatsAppConversation.objects.get_or_create(
                customer_phone=from_number,
                client=client,
                qr_code=qr_code,
                table=table,
                is_active=True,
                defaults={
                    'started_at': timezone.now(),
                    'messages': [{
                        'role': 'user',
                        'content': message_body,
                        'timestamp': timezone.now().isoformat()
                    }]
                }
            )
            
            if not created:
                if not conversation.messages:
                    conversation.messages = []
                conversation.messages.append({
                    'role': 'user',
                    'content': message_body,
                    'timestamp': timezone.now().isoformat()
                })
                conversation.save()
            
            # Створюємо відповідь
            if qr_code:
                location_name = qr_code.name or qr_code.location or "цей QR код"
                response_text = f"Привіт! Ви зайшли через {location_name} в {client.company_name}. Чим можу допомогти?"
            elif table:
                response_text = f"Привіт! Ви зайшли до столика {table_number} в {client.company_name}. Чим можу допомогти?"
            else:
                response_text = f"Привіт! Вітаємо в {client.company_name}. Чим можу допомогти?"
            
            # Додаємо відповідь до розмови
            if not conversation.messages:
                conversation.messages = []
            conversation.messages.append({
                'role': 'assistant',
                'content': response_text,
                'timestamp': timezone.now().isoformat()
            })
            conversation.save()
            
            logger.info(f"START2 processed successfully: client={client.id}, phone={from_number}")
            
            # Відправляємо повідомлення
            send_whatsapp_text(from_number, response_text)
            
        except Exception as e:
            logger.error(f"Error processing START2 command: {str(e)}", exc_info=True)
            send_whatsapp_text(from_number, "Вибачте, виникла помилка. Спробуйте пізніше.")
    
    def handle_regular_message(self, from_number, message_body):
        """Обробляє звичайні повідомлення з RAG логікою"""
        try:
            # Шукаємо активну розмову
            conversation = ClientWhatsAppConversation.objects.filter(
                customer_phone=from_number,
                is_active=True
            ).first()
            
            # Backward compatibility
            if not conversation:
                conversation_restaurant = RestaurantConversation.objects.filter(
                    customer_phone=from_number,
                    is_active=True
                ).first()
                if conversation_restaurant:
                    conversation, _ = ClientWhatsAppConversation.objects.get_or_create(
                        customer_phone=from_number,
                        client=conversation_restaurant.client,
                        table=conversation_restaurant.table,
                        is_active=True,
                        defaults={
                            'started_at': conversation_restaurant.started_at,
                            'messages': conversation_restaurant.messages,
                            'total_messages': conversation_restaurant.total_messages,
                        }
                    )
            
            if not conversation:
                response_text = self.generate_rag_response_without_conversation(message_body)
            else:
                response_text = self.generate_rag_response(message_body, conversation)
            
            logger.info(f"Regular message processed: phone={from_number}")
            
            # Відправляємо повідомлення
            send_whatsapp_text(from_number, response_text)
            
        except Exception as e:
            logger.error(f"Error processing regular message: {str(e)}", exc_info=True)
            send_whatsapp_text(from_number, "Вибачте, виникла помилка. Спробуйте пізніше.")
    
    def generate_rag_response_without_conversation(self, message_body):
        """Генерує відповідь за допомогою RAG без активної розмови"""
        try:
            # Знаходимо клієнта з embeddings (не тільки ресторани)
            client = Client.objects.exclude(
                embeddings__isnull=True
            ).first()
            
            if not client:
                client = Client.objects.first()
            
            if not client:
                return "Привіт! Для початку роботи надішліть команду START2 з QR-коду."
            
            # Використовуємо RAG API
            try:
                from MASTER.rag.response_generator import ResponseGenerator, RAGResponse
                
                generator = ResponseGenerator()
                rag_response = generator.generate(
                    query=message_body,
                    client=client,
                    stream=False
                )
                
                if isinstance(rag_response, RAGResponse):
                    response_text = rag_response.answer
                    logger.info(f"RAG response generated (no conversation): {len(response_text)} chars")
                else:
                    response_text = "Вибачте, виникла помилка при генерації відповіді."
                
            except Exception as e:
                logger.error(f"RAG generation failed (no conversation): {str(e)}", exc_info=True)
                response_text = f"Привіт! Як можу допомогти? Надішліть команду START2 з QR-коду для кращої допомоги."
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error in generate_rag_response_without_conversation: {str(e)}", exc_info=True)
            return "Вибачте, виникла помилка. Спробуйте пізніше."
    
    def generate_rag_response(self, message_body, conversation):
        """Генерує відповідь за допомогою RAG для розмови"""
        try:
            client = conversation.client
            
            # Використовуємо RAG API
            try:
                from MASTER.rag.response_generator import ResponseGenerator, RAGResponse
                
                generator = ResponseGenerator()
                rag_response = generator.generate(
                    query=message_body,
                    client=client,
                    stream=False
                )
                
                if isinstance(rag_response, RAGResponse):
                    response_text = rag_response.answer
                    logger.info(f"RAG response generated: {len(response_text)} chars")
                else:
                    response_text = "Вибачте, виникла помилка при генерації відповіді."
                
            except Exception as e:
                logger.error(f"RAG generation failed: {str(e)}", exc_info=True)
                response_text = f"Дякую за повідомлення! Як можу допомогти?"
            
            # Зберігаємо повідомлення в розмову
            if isinstance(conversation, ClientWhatsAppConversation):
                conversation.add_message('user', message_body)
                conversation.add_message('assistant', response_text)
            else:
                # Backward compatibility
                if not conversation.messages:
                    conversation.messages = []
                conversation.messages.append({
                    'role': 'user',
                    'content': message_body,
                    'timestamp': timezone.now().isoformat()
                })
                conversation.messages.append({
                    'role': 'assistant',
                    'content': response_text,
                    'timestamp': timezone.now().isoformat()
                })
                conversation.save()
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {str(e)}", exc_info=True)
            return "Вибачте, виникла помилка. Спробуйте ще раз."
    
    def verify_signature(self, ref_data, table_number, signature):
        """Перевіряє HMAC підпис START2 команди"""
        try:
            secret = getattr(settings, 'WHATSAPP_QR_SECRET', '')
            if not secret:
                logger.warning("WHATSAPP_QR_SECRET not configured")
                return False
            
            ref_data_with_padding = ref_data + '=' * (4 - len(ref_data) % 4)
            decoded = base64.urlsafe_b64decode(ref_data_with_padding).decode('utf-8')
            payload = f"{decoded}|{table_number}"
            
            expected_sig = hmac.new(
                secret.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()[:16]
            
            return hmac.compare_digest(expected_sig, signature)
            
        except Exception as e:
            logger.error(f"Signature verification error: {str(e)}", exc_info=True)
            return False