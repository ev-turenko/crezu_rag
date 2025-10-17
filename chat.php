<?php
$base_url = 'http://localhost:3000';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');
    
    if ($_POST['action'] === 'send_message') {
        $message = $_POST['message'];
        $chat_id = $_POST['chat_id'] ?? null;
        
        $data = [
            'message' => $message,
            'params' => [
                'client_id' => '40dc244e-2fe3-4252-be0a-520bae23cbc1',
                'country' => 1,
                'provider' => 2
            ]
        ];
        
        if ($chat_id) {
            $data['params']['chat_id'] = $chat_id;
        }
        
        $url = $base_url . '/api/ai/message?lang=es-mx';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            echo $response;
        } else {
            $errorInfo = curl_error($ch);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to connect to AI service: HTTP ' . $httpCode . ($errorInfo ? ' - ' . $errorInfo : '')
            ]);
        }
    } elseif ($_POST['action'] === 'get_history') {
        $chat_id = $_POST['chat_id'];
        
        // $data = [
        //     'chat_id' => $chat_id
        // ];

        $data['params']['chat_id'] = $chat_id;
        
        $url = $base_url . '/api/ai/history';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            echo $response;
        } else {
            $errorInfo = curl_error($ch);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch chat history: HTTP ' . $httpCode . ($errorInfo ? ' - ' . $errorInfo : '')
            ]);
        }
    } elseif ($_POST['action'] === 'get_chats') {
        $client_id = $_POST['client_id'] ?? '40dc244e-2fe3-4252-be0a-520bae23cbc1';
        
        $data = [
            'client_id' => $client_id
        ];
        
        $url = $base_url . '/api/ai/chats';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            echo $response;
        } else {
            $errorInfo = curl_error($ch);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch chats: HTTP ' . $httpCode . ($errorInfo ? ' - ' . $errorInfo : '')
            ]);
        }
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="es-mx">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat con IA</title>
    <script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js"></script>
    <style>
        :root {
            --bg-primary: #121212;
            --bg-secondary: #1e1e1e;
            --bg-tertiary: #2d2d2d;
            --text-primary: #e0e0e0;
            --text-secondary: #a0a0a0;
            --accent: #bb86fc;
            --accent-variant: #3700b3;
            --error: #cf6679;
            --user-msg-bg: #1e3a5f;
            --ai-msg-bg: #2d2d2d;
            --button-bg: #333;
            --card-bg: #252525;
            --card-border: #444;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            max-width: 800px;
            margin: 0 auto;
            background-color: var(--bg-secondary);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        .chat-header {
            padding: 1rem;
            background-color: var(--bg-tertiary);
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .chat-header h1 {
            color: var(--accent);
            font-size: 1.5rem;
        }
        
        .header-controls {
            display: flex;
            gap: 0.5rem;
        }
        
        .new-chat-button {
            padding: 0.5rem 1rem;
            background-color: var(--button-bg);
            color: var(--text-primary);
            border: 1px solid #444;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        
        .new-chat-button:hover {
            background-color: var(--accent-variant);
            border-color: var(--accent);
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        
        .message {
            max-width: 80%;
            padding: 0.75rem 1rem;
            border-radius: 1rem;
            line-height: 1.4;
            word-wrap: break-word;
        }
        
        .message.start-group {
            margin-top: 1rem;
        }
        
        .message:not(.start-group) {
            margin-top: 0.25rem;
        }
        
        .user-message {
            justify-self: flex-end;
            background-color: var(--user-msg-bg);
            border-bottom-right-radius: 0.25rem;
        }
        
        .ai-message {
            justify-self: flex-start;
            background-color: var(--ai-msg-bg);
            border-bottom-left-radius: 0.25rem;
        }
        
        .message-sender {
            font-size: 0.75rem;
            margin-bottom: 0.25rem;
            color: var(--text-secondary);
        }
        
        .welcome-message {
            text-align: center;
            padding: 2rem;
            color: var(--text-secondary);
        }
        
        .welcome-message h3 {
            color: var(--accent);
            margin-bottom: 1rem;
        }
        
        .chat-input-container {
            display: flex;
            padding: 1rem;
            background-color: var(--bg-tertiary);
            border-top: 1px solid #333;
        }
        
        .chat-input {
            flex: 1;
            padding: 0.75rem;
            border: none;
            border-radius: 0.5rem;
            background-color: var(--bg-secondary);
            color: var(--text-primary);
            font-size: 1rem;
            resize: none;
            max-height: 120px;
        }
        
        .chat-input:focus {
            outline: 2px solid var(--accent);
        }
        
        .send-button {
            margin-left: 0.5rem;
            padding: 0.75rem 1.5rem;
            background-color: var(--accent);
            color: var(--bg-primary);
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        
        .send-button:hover:not(:disabled) {
            background-color: var(--accent-variant);
        }
        
        .send-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: var(--accent);
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .error-message {
            color: var(--error);
            text-align: center;
            padding: 0.5rem;
        }
        
        .chat-id-display {
            font-size: 0.75rem;
            color: var(--text-secondary);
            text-align: center;
            padding: 0.5rem;
            background-color: var(--bg-tertiary);
            border-bottom: 1px solid #333;
        }
        
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .modal-content {
            background-color: var(--bg-secondary);
            padding: 1.5rem;
            border-radius: 0.5rem;
            max-width: 400px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .modal-content h2 {
            color: var(--accent);
            margin-bottom: 1rem;
        }
        
        .chat-list {
            list-style: none;
        }
        
        .chat-item {
            padding: 1rem;
            background-color: var(--bg-tertiary);
            margin-bottom: 0.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .chat-item:hover {
            background-color: var(--accent-variant);
        }
        
        .chat-item-title {
            font-weight: bold;
        }
        
        .chat-item-preview {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-top: 0.25rem;
        }
        
        .close-modal {
            margin-top: 1rem;
            width: 100%;
            padding: 0.75rem;
            background-color: var(--button-bg);
            color: var(--text-primary);
            border: 1px solid #444;
            border-radius: 0.5rem;
            cursor: pointer;
        }
        
        .close-modal:hover {
            background-color: var(--accent-variant);
        }
        
        .offer-card {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 0.5rem 0;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .offer-card-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .offer-card-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
        }
        
        .offer-card-title {
            font-size: 1.1rem;
            font-weight: bold;
            color: var(--text-primary);
        }
        
        .offer-card-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .offer-card-details span {
            display: block;
        }
        
        .offer-card-button {
            padding: 0.5rem 1rem;
            background-color: var(--accent);
            color: var(--bg-primary);
            text-align: center;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        
        .offer-card-button:hover {
            background-color: var(--accent-variant);
        }
        
        .show-more-button {
            margin: 0.5rem 0;
            padding: 0.5rem 1rem;
            background-color: var(--button-bg);
            color: var(--text-primary);
            border: 1px solid #444;
            border-radius: 0.5rem;
            cursor: pointer;
            text-align: center;
            transition: background-color 0.2s;
        }
        
        .show-more-button:hover {
            background-color: var(--accent-variant);
        }
        
        @media (max-width: 600px) {
            .message {
                max-width: 90%;
            }
            
            .chat-container {
                height: 100vh;
            }
            
            .chat-header {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .header-controls {
                width: 100%;
                justify-content: center;
            }
            
            .offer-card-details {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="chat-container">
            <div class="chat-header">
                <h1>Chat con IA</h1>
                <div class="header-controls">
                    <button 
                        @click="startNewChat" 
                        class="new-chat-button"
                        :disabled="loading">
                        Nuevo Chat
                    </button>
                    <button 
                        @click="openChatsList" 
                        class="new-chat-button"
                        :disabled="loading">
                        Chats Existentes
                    </button>
                </div>
            </div>
            <div class="chat-id-display" v-if="chatId">
                ID del Chat: {{ chatId }}
            </div>
            <div class="chat-messages" ref="messagesContainer">
                <div v-if="messages.length === 0" class="welcome-message">
                    <h3>Bienvenido al Chat con IA</h3>
                    <p>Comienza una nueva conversación escribiendo un mensaje abajo o selecciona un chat existente.</p>
                </div>
                <div v-else>
                    <div v-for="(message, index) in messages" :key="message.id" 
                         :class="['message', message.from === 'user' ? 'user-message' : 'ai-message', {'start-group': isStartOfGroup(index)} ]">
                        <div class="message-sender" v-if="isStartOfGroup(index)">
                            {{ message.from === 'user' ? 'Tú' : 'IA' }}
                        </div>
                        <div v-for="(content, contentIndex) in message.data" :key="contentIndex">
                            <div v-if="content.type === 'text'">{{ content.content }}</div>
                            <div v-else-if="content.type === 'code'">
                                <pre><code>{{ content.content }}</code></pre>
                            </div>
                            <div v-else-if="content.type === 'offers'">
                                <div v-for="(offer, offerIndex) in getVisibleOffers(content.content, message.id)" :key="offer.id" class="offer-card">
                                    <div class="offer-card-header">
                                        <img v-if="offer.avatar" :src="offer.avatar" class="offer-card-logo" alt="Offer logo">
                                        <span class="offer-card-title">{{ offer.name }}</span>
                                    </div>
                                    <div class="offer-card-details">
                                        <!-- {{ JSON.stringify(offer, null, 2) }} -->
                                        <span><strong>{{offer.headers[0].title || 'N/A'}}</strong> {{ offer.headers[0].value || 'N/A' }}</span>
                                        <span><strong>{{offer.headers[1].title || 'N/A'}}</strong> {{ offer.headers[1].value || 'N/A' }}</span>
                                        <span><strong>{{offer.headers[2].title || 'N/A'}}</strong> {{ offer.headers[2].value || 'N/A' }}</span>
                                        <span><strong>{{offer.headers[3].title || 'N/A'}}</strong> {{ offer.headers[3].value || 'N/A' }}</span>
                                    </div>
                                    <a :href="offer.url" target="_blank" class="offer-card-button">Solicitar Ahora</a>
                                </div>
                                <button 
                                    v-if="content.content.length > 3 && content.content.length > visibleOffers[message.id]"
                                    @click="showMoreOffers(message.id, content.content.length)"
                                    class="show-more-button">
                                    Mostrar {{ visibleOffers[message.id] < content.content.length ? 'Más' : 'Menos' }}
                                </button>
                            </div>
                            <div v-else>{{ content.content }}</div>
                        </div>
                    </div>
                </div>
                <div v-if="loading" class="message ai-message" :class="{'start-group': isStartOfLoadingGroup()}">
                    <div class="loading"></div>
                </div>
            </div>
            <div class="error-message" v-if="error">
                {{ error }}
            </div>
            <div class="chat-input-container">
                <textarea 
                    v-model="inputMessage" 
                    @keydown.enter.exact.prevent="sendMessage"
                    placeholder="Escribe tu mensaje..."
                    class="chat-input"
                    rows="1"
                    ref="messageInput"
                    :disabled="loading">
                </textarea>
                <button 
                    @click="sendMessage" 
                    class="send-button"
                    :disabled="!inputMessage.trim() || loading">
                    Enviar
                </button>
            </div>
        </div>
        
        <!-- Modal for chats list -->
        <div v-if="showChatsList" class="modal">
            <div class="modal-content">
                <h2>Chats Existentes</h2>
                <ul class="chat-list">
                    <li v-for="chat in chats" :key="chat.chat_id" class="chat-item" @click="selectChat(chat.chat_id)">
                        <div class="chat-item-title">Chat ID: {{ chat.chat_id }}</div>
                        <div class="chat-item-preview" v-if="chat.preview">{{ chat.preview }}</div>
                    </li>
                </ul>
                <button @click="showChatsList = false" class="close-modal">Cerrar</button>
            </div>
        </div>
    </div>

    <script>
        new Vue({
            el: '#app',
            data: {
                messages: [],
                inputMessage: '',
                loading: false,
                error: '',
                chatId: null,
                chats: [],
                showChatsList: false,
                offersCache: {},
                visibleOffers: {}
            },
            mounted() {
                this.$refs.messageInput.focus();
                
                this.$refs.messageInput.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';
                });
                
                this.getChats();
            },
            methods: {
                isStartOfGroup(index) {
                    return index === 0 || this.messages[index].from !== this.messages[index - 1].from;
                },
                isStartOfLoadingGroup() {
                    if (this.messages.length === 0) return true;
                    const lastMessage = this.messages[this.messages.length - 1];
                    return lastMessage.from !== 'ai';
                },
                async fetchOfferDetails(offerIds) {
                    const unfetchedIds = offerIds.filter(id => !this.offersCache[id]);
                    if (unfetchedIds.length === 0) return;

                    try {
                        const response = await fetch('https://finmatcher.com/api/offer?size=100000');
                        const data = await response.json();
                        if (data.items) {
                            data.items.forEach(offer => {
                                if (unfetchedIds.includes(offer.id)) {
                                    this.$set(this.offersCache, offer.id, offer);
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Error fetching offers:', err);
                        this.error = 'Error al cargar detalles de las ofertas';
                    }
                },
                getVisibleOffers(offerIds, messageId) {
                    if (!this.visibleOffers[messageId]) {
                        this.$set(this.visibleOffers, messageId, 3);
                    }
                    const visibleCount = this.visibleOffers[messageId];
                    return offerIds.slice(0, visibleCount).map(id => this.offersCache[id]).filter(offer => offer);
                },
                showMoreOffers(messageId, totalOffers) {
                    if (this.visibleOffers[messageId] < totalOffers) {
                        this.$set(this.visibleOffers, messageId, totalOffers);
                    } else {
                        this.$set(this.visibleOffers, messageId, 3);
                    }
                    this.$nextTick(() => {
                        this.scrollToBottom();
                    });
                },
                async sendMessage() {
                    if (!this.inputMessage.trim() || this.loading) return;
                    
                    const userMessage = this.inputMessage.trim();
                    this.inputMessage = '';
                    
                    this.messages.push({
                        id: Date.now(),
                        from: 'user',
                        data: [{ type: 'text', content: userMessage }]
                    });
                    
                    this.loading = true;
                    this.error = '';
                    
                    try {
                        const formData = new FormData();
                        formData.append('action', 'send_message');
                        formData.append('message', userMessage);
                        if (this.chatId) {
                            formData.append('chat_id', this.chatId);
                        }
                        
                        const response = await fetch('', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            if (!this.chatId) {
                                this.chatId = data.chat_id;
                            }
                            
                            const aiMessage = {
                                id: Date.now() + 1,
                                from: 'ai',
                                data: data.answer
                            };
                            
                            for (const content of aiMessage.data) {
                                if (content.type === 'offers' && Array.isArray(content.content)) {
                                    await this.fetchOfferDetails(content.content);
                                }
                            }
                            
                            this.messages.push(aiMessage);
                            
                            this.getChats();
                            
                            this.$nextTick(() => {
                                this.scrollToBottom();
                            });
                        } else {
                            this.error = 'Error al obtener respuesta de la IA';
                        }
                    } catch (err) {
                        console.error('Error:', err);
                        this.error = 'Error de conexión';
                    } finally {
                        this.loading = false;
                    }
                },
                
                startNewChat() {
                    if (this.loading) return;
                    
                    this.messages = [];
                    this.chatId = null;
                    this.error = '';
                    this.inputMessage = '';
                    this.visibleOffers = {};
                    
                    this.$refs.messageInput.style.height = 'auto';
                    
                    this.$refs.messageInput.focus();
                },
                
                async getChats() {
                    try {
                        const formData = new FormData();
                        formData.append('action', 'get_chats');
                        formData.append('client_id', '40dc244e-2fe3-4252-be0a-520bae23cbc1');
                        
                        const response = await fetch('', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            this.chats = data.chats.map(chat => ({
                                ...chat,
                                preview: chat.preview || 'No preview available'
                            }));
                        } else {
                            this.error = 'Error al cargar lista de chats';
                        }
                    } catch (err) {
                        console.error('Error loading chats:', err);
                        this.error = 'Error de conexión al cargar chats';
                    }
                },
                
                openChatsList() {
                    this.getChats();
                    this.showChatsList = true;
                },
                
                async selectChat(chatId) {
                    this.chatId = chatId;
                    this.showChatsList = false;
                    this.messages = [];
                    this.visibleOffers = {};
                    await this.loadChatHistory();
                },
                
                scrollToBottom() {
                    const container = this.$refs.messagesContainer;
                    container.scrollTop = container.scrollHeight;
                },
                
                async loadChatHistory() {
                    if (!this.chatId) return;
                    
                    this.loading = true;
                    this.error = '';
                    
                    try {
                        const formData = new FormData();
                        formData.append('action', 'get_history');
                        formData.append('chat_id', this.chatId);
                        
                        const response = await fetch('', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            this.messages = data.messages.map(msg => ({
                                id: Date.now() + Math.random(),
                                from: msg.from,
                                data: msg.data
                            }));
                            
                            for (const message of this.messages) {
                                for (const content of message.data) {
                                    if (content.type === 'offers' && Array.isArray(content.content)) {
                                        await this.fetchOfferDetails(content.content);
                                    }
                                }
                            }
                            
                            this.$nextTick(() => {
                                this.scrollToBottom();
                            });
                        } else {
                            this.error = 'Error al cargar historial del chat';
                        }
                    } catch (err) {
                        console.error('Error loading history:', err);
                        this.error = 'Error de conexión al cargar historial';
                    } finally {
                        this.loading = false;
                    }
                }
            },
            watch: {
                messages() {
                    this.$nextTick(() => {
                        this.scrollToBottom();
                    });
                }
            }
        });
    </script>
</body>
</html>