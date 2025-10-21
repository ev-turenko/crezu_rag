<?php
$base_url = 'http://localhost:3000';

$request_uri = $_SERVER['REQUEST_URI'];

if (strpos($request_uri, '/manifest.json') !== false) {
    header('Content-Type: application/json');
    echo json_encode([
        "name" => "Chat con IA",
        "short_name" => "IA Chat",
        "start_url" => "/",
        "display" => "fullscreen",
        "background_color" => "#121212",
        "theme_color" => "#bb86fc",
        "icons" => [
            [
                "src" => "/icon-192.png",
                "sizes" => "192x192",
                "type" => "image/png"
            ],
            [
                "src" => "/icon-512.png",
                "sizes" => "512x512",
                "type" => "image/png"
            ]
        ]
    ]);
    exit;
} elseif (strpos($request_uri, '/sw.js') !== false) {
    header('Content-Type: application/javascript');
    echo "
self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Minimal fetch handler for PWA installability
});
    ";
    exit;
}

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
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked@4.0.0/marked.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#121212',
                        secondary: '#1e1e1e',
                        tertiary: '#2d2d2d',
                        textprimary: '#e0e0e0',
                        textsecondary: '#a0a0a0',
                        accent: '#bb86fc',
                        accentvariant: '#3700b3',
                        error: '#cf6679',
                        usermsgbg: '#1e3a5f',
                        aimsgbg: '#2d2d2d',
                        buttonbg: '#333',
                        cardbg: '#252525',
                        cardborder: '#444',
                    },
                    fontFamily: {
                        body: ["'Segoe UI'", 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
                    }
                }
            }
        }
    </script>
</head>
<body class="font-body bg-primary text-textprimary h-screen flex flex-col">
    <div id="app">
        <div class="flex flex-col h-screen max-w-[800px] mx-auto bg-secondary shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div class="p-4 bg-tertiary border-b border-[#333] flex flex-col gap-2 justify-between items-center sm:flex-row sm:gap-0">
                <h1 class="text-accent text-xl">Chat con IA</h1>
                <div class="flex gap-2 w-full justify-center sm:w-auto sm:justify-normal">
                    <button 
                        @click="startNewChat" 
                        class="py-2 px-4 bg-buttonbg text-textprimary border border-[#444] rounded-lg cursor-pointer text-sm transition-all duration-200 hover:bg-accentvariant hover:border-accent"
                        :disabled="loading">
                        Nuevo Chat
                    </button>
                    <button 
                        @click="openChatsList" 
                        class="py-2 px-4 bg-buttonbg text-textprimary border border-[#444] rounded-lg cursor-pointer text-sm transition-all duration-200 hover:bg-accentvariant hover:border-accent"
                        :disabled="loading">
                        Chats Existentes
                    </button>
                    <button 
                        v-if="canInstall"
                        @click="installApp" 
                        class="py-2 px-4 bg-buttonbg text-textprimary border border-[#444] rounded-lg cursor-pointer text-sm transition-all duration-200 hover:bg-accentvariant hover:border-accent"
                        :disabled="loading">
                        Install
                    </button>
                </div>
            </div>
            <div class="text-xs text-textsecondary text-center p-2 bg-tertiary border-b border-[#333]" v-if="chatId">
                ID del Chat: {{ chatId }}
            </div>
            <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-0" ref="messagesContainer">
                <div v-if="messages.length === 0" class="text-center p-8 text-textsecondary">
                    <h3 class="text-accent mb-4">Bienvenido al Chat con IA</h3>
                    <p>Comienza una nueva conversación escribiendo un mensaje abajo o selecciona un chat existente.</p>
                </div>
                <div v-else>
                    <div v-for="(message, index) in messages" :key="message.id" 
                         :class="[
                             'max-w-[90%] sm:max-w-[80%] py-3 px-4 rounded-2xl leading-relaxed break-words',
                             message.from === 'user' ? 'self-end bg-usermsgbg rounded-br-sm' : 'self-start bg-aimsgbg rounded-bl-sm',
                             {'mt-4': isStartOfGroup(index), 'mt-1': !isStartOfGroup(index) }
                         ]">
                        <div class="text-xs mb-1 text-textsecondary" v-if="isStartOfGroup(index)">
                            {{ message.from === 'user' ? 'Tú' : 'IA' }}
                        </div>
                        <div v-for="(content, contentIndex) in message.data" :key="contentIndex">
                            <div v-if="content.type === 'text'">{{ content.content }}</div>
                            <div v-else-if="content.type === 'code'">
                                <pre><code>{{ content.content }}</code></pre>
                            </div>
                            <div v-else-if="content.type === 'markdown'" v-html="renderMarkdown(content.content)"></div>
                            <div v-else-if="content.type === 'offers'">
                                <div v-for="(offer, offerIndex) in getVisibleOffers(content.content, message.id)" :key="offer.id" class="bg-cardbg border border-cardborder rounded-lg p-4 my-2 flex flex-col gap-2">
                                    <div class="flex items-center gap-2">
                                        <img v-if="offer.avatar" :src="offer.avatar" class="w-10 h-10 object-contain" alt="Offer logo">
                                        <span class="text-lg font-bold text-textprimary">{{ offer.name }}</span>
                                    </div>
                                    <div class="grid grid-cols-1 gap-2 text-sm text-textsecondary sm:grid-cols-2">
                                        <!-- {{ JSON.stringify(offer, null, 2) }} -->
                                        <span class="block"><strong>{{offer.headers[0].title || 'N/A'}}</strong> {{ offer.headers[0].value || 'N/A' }}</span>
                                        <span class="block"><strong>{{offer.headers[1].title || 'N/A'}}</strong> {{ offer.headers[1].value || 'N/A' }}</span>
                                        <span class="block"><strong>{{offer.headers[2].title || 'N/A'}}</strong> {{ offer.headers[2].value || 'N/A' }}</span>
                                        <span class="block"><strong>{{offer.headers[3].title || 'N/A'}}</strong> {{ offer.headers[3].value || 'N/A' }}</span>
                                    </div>
                                    <a :href="offer.url" target="_blank" class="py-2 px-4 bg-accent text-primary text-center rounded-lg no-underline font-bold transition-colors duration-200 hover:bg-accentvariant">Solicitar Ahora</a>
                                </div>
                                <button 
                                    v-if="content.content.length > 3 && content.content.length > visibleOffers[message.id]"
                                    @click="showMoreOffers(message.id, content.content.length)"
                                    class="my-2 py-2 px-4 bg-buttonbg text-textprimary border border-[#444] rounded-lg cursor-pointer text-center transition-colors duration-200 hover:bg-accentvariant">
                                    Mostrar {{ visibleOffers[message.id] < content.content.length ? 'Más' : 'Menos' }}
                                </button>
                            </div>
                            <div v-else>{{ content.content }}</div>
                        </div>
                    </div>
                </div>
                <div v-if="loading" 
                     :class="[
                         'max-w-[90%] sm:max-w-[80%] py-3 px-4 rounded-2xl leading-relaxed break-words self-start bg-aimsgbg rounded-bl-sm',
                         {'mt-4': isStartOfLoadingGroup(), 'mt-1': !isStartOfLoadingGroup() }
                     ]">
                    <div class="inline-block w-5 h-5 border-[3px] border-[rgba(255,255,255,0.3)] border-t-accent rounded-full animate-spin"></div>
                </div>
            </div>
            <div class="text-error text-center p-2" v-if="error">
                {{ error }}
            </div>
            <div class="flex p-4 bg-tertiary border-t border-[#333]">
                <textarea 
                    v-model="inputMessage" 
                    @keydown.enter.exact.prevent="sendMessage"
                    placeholder="Escribe tu mensaje..."
                    class="flex-1 p-3 border-none rounded-lg bg-secondary text-textprimary text-base resize-none max-h-[120px] focus:outline focus:outline-2 focus:outline-accent"
                    rows="1"
                    ref="messageInput"
                    :disabled="loading">
                </textarea>
                <button 
                    @click="sendMessage" 
                    class="ml-2 py-3 px-6 bg-accent text-primary border-none rounded-lg cursor-pointer font-bold transition-colors duration-200 hover:bg-accentvariant disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="!inputMessage.trim() || loading">
                    Enviar
                </button>
            </div>
        </div>
        
        <!-- Modal for chats list -->
        <div v-if="showChatsList" class="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-[1000]">
            <div class="bg-secondary p-6 rounded-lg max-w-md w-[90%] max-h-[80vh] overflow-y-auto text-center">
                <h2 class="text-accent mb-4">Chats Existentes</h2>
                <ul class="list-none">
                    <li v-for="chat in chats" :key="chat.chat_id" class="p-4 bg-tertiary mb-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-accentvariant" @click="selectChat(chat.chat_id)">
                        <div class="font-bold">Chat ID: {{ chat.chat_id }}</div>
                        <div class="text-sm text-textsecondary mt-1" v-if="chat.preview">{{ chat.preview }}</div>
                    </li>
                </ul>
                <button @click="showChatsList = false" class="mt-4 w-full py-3 bg-buttonbg text-textprimary border border-[#444] rounded-lg cursor-pointer hover:bg-accentvariant">Cerrar</button>
            </div>
        </div>
        
        <!-- Modal for install loading -->
        <div v-if="showInstallLoading" class="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-[1000]">
            <div class="bg-secondary p-6 rounded-lg max-w-md w-[90%] max-h-[80vh] overflow-y-auto text-center">
                <div class="inline-block w-5 h-5 border-[3px] border-[rgba(255,255,255,0.3)] border-t-accent rounded-full animate-spin"></div>
                <p>Instalando la aplicación...</p>
            </div>
        </div>
        
        <!-- Modal for open button after install -->
        <div v-if="showOpenButton" class="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-[1000]">
            <div class="bg-secondary p-6 rounded-lg max-w-md w-[90%] max-h-[80vh] overflow-y-auto text-center">
                <p>Aplicación instalada exitosamente.</p>
                <button @click="openApp" class="py-3 px-6 bg-accent text-primary border-none rounded-lg cursor-pointer font-bold transition-colors duration-200 mt-4 hover:bg-accentvariant">Abrir Aplicación</button>
            </div>
        </div>
    </div>

    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registered', reg))
                .catch(err => console.error('Service Worker registration failed', err));
        }

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
                visibleOffers: {},
                isAndroid: false,
                isStandalone: false,
                deferredPrompt: null,
                showInstallLoading: false,
                showOpenButton: false
            },
            computed: {
                canInstall() {
                    return this.isAndroid && !this.isStandalone && this.deferredPrompt;
                }
            },
            mounted() {
                this.$refs.messageInput.focus();
                
                this.$refs.messageInput.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';
                });
                
                this.isAndroid = /Android/i.test(navigator.userAgent);
                this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || false;
                
                window.addEventListener('beforeinstallprompt', (e) => {
                    e.preventDefault();
                    this.deferredPrompt = e;
                });
                
                window.addEventListener('appinstalled', () => {
                    this.showInstallLoading = false;
                    this.showOpenButton = true;
                });
                
                this.getChats();
            },
            methods: {
                renderMarkdown(content) {
                    return marked.parse(content);
                },
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
                installApp() {
                    if (this.deferredPrompt) {
                        this.showInstallLoading = true;
                        this.deferredPrompt.prompt();
                        this.deferredPrompt.userChoice.then((choiceResult) => {
                            if (choiceResult.outcome === 'dismissed') {
                                this.showInstallLoading = false;
                            }
                            this.deferredPrompt = null;
                        });
                    }
                },
                openApp() {
                    const protocol = location.protocol.slice(0, -1);
                    const host = location.host;
                    window.location.href = `intent://${host}/#Intent;scheme=${protocol};package=com.android.chrome;end`;
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