import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { AIModel, ChatDbRecord } from '../models/AiModel.js';

export class ViewChatController {
    async viewSharedChat(req: Request, res: Response) {
        const chatId = req.params.chat_id;

        try {
            if (!chatId) {
                return res.status(400).send(this.renderErrorPage('Invalid chat ID'));
            }

            const chat: ChatDbRecord | null = await AIModel.getChatById(chatId);

            if (!chat) {
                return res.status(404).send(this.renderErrorPage('Chat not found'));
            }

            if (!chat.is_public) {
                return res.status(403).send(this.renderErrorPage('This chat is not public'));
            }

            const html = this.renderChatPage(chat);
            return res.status(200).send(html);

        } catch (error) {
            console.error('Error viewing shared chat:', error);
            return res.status(500).send(this.renderErrorPage('Internal server error'));
        }
    }

    async downloadSharedChatPdf(req: Request, res: Response) {
        const chatId = req.params.chat_id;

        try {
            if (!chatId) {
                return res.status(400).send(this.renderErrorPage('Invalid chat ID'));
            }

            const chat: ChatDbRecord | null = await AIModel.getChatById(chatId);

            if (!chat) {
                return res.status(404).send(this.renderErrorPage('Chat not found'));
            }

            if (!chat.is_public) {
                return res.status(403).send(this.renderErrorPage('This chat is not public'));
            }

            const html = this.renderChatPage(chat);

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            try {
                const page = await browser.newPage();
                await page.setContent(html, { waitUntil: 'networkidle0' });

                const pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: true
                });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename="chat-${chatId}.pdf"`
                );

                return res.status(200).send(pdfBuffer);
            } finally {
                await browser.close();
            }

        } catch (error) {
            console.error('Error downloading chat PDF:', error);
            return res.status(500).send(this.renderErrorPage('Internal server error'));
        }
    }

    private renderErrorPage(message: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Shared Chat</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div class="mb-4">
            <svg class="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Error</h1>
        <p class="text-gray-600">${this.escapeHtml(message)}</p>
    </div>
</body>
</html>
        `;
    }

    private renderChatPage(chat: ChatDbRecord): string {
        const messagesData = chat.messages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
                role: msg.role,
                data: msg.data
            }));

            console.log('Rendering chat with messages:', JSON.stringify(messagesData, null, 2));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shared Chat - Crezu RAG</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        [v-cloak] { display: none; }
        
        .prose {
            color: #374151;
            line-height: 1.75;
        }
        .prose p {
            margin-bottom: 1rem;
        }
        .prose ul, .prose ol {
            margin-left: 1.5rem;
            margin-bottom: 1rem;
        }
        .prose ul {
            list-style-type: disc;
        }
        .prose ol {
            list-style-type: decimal;
        }
        .prose li {
            margin-bottom: 0.5rem;
        }
        .prose code {
            background: #f1f5f9;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            font-family: monospace;
            font-size: 0.875rem;
        }
        .prose pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin-bottom: 1rem;
        }
        .prose pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        .prose h1, .prose h2, .prose h3, .prose h4 {
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
        }
        .prose h1 {
            font-size: 1.875rem;
        }
        .prose h2 {
            font-size: 1.5rem;
        }
        .prose h3 {
            font-size: 1.25rem;
        }
        .prose a {
            color: #2563eb;
            text-decoration: underline;
        }
        .prose a:hover {
            color: #1d4ed8;
        }
        .prose strong {
            font-weight: 600;
        }
        .prose em {
            font-style: italic;
        }
        .prose blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1rem;
            color: #6b7280;
            font-style: italic;
            margin: 1rem 0;
        }
    </style>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
    <div id="app" v-cloak>
        <div class="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-semibold text-gray-900">Shared Conversation</h1>
                        <p class="text-sm text-gray-500 mt-1">{{ formattedDate }}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg class="w-2 h-2 mr-1.5" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                            </svg>
                            Public
                        </span>
                    </div>
                </div>
            </div>

            <!-- Messages -->
            <div class="space-y-4">
                <div v-for="(message, index) in messages" :key="index" 
                     class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <!-- Message Header -->
                    <div :class="['px-4 py-2 text-sm font-medium border-b', 
                                  message.role === 'user' 
                                    ? 'bg-blue-50 text-blue-900 border-blue-100' 
                                    : 'bg-gray-50 text-gray-900 border-gray-100']">
                        <div class="flex items-center space-x-2">
                            <svg v-if="message.role === 'user'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                            </svg>
                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>{{ message.role === 'user' ? 'User' : 'Assistant' }}</span>
                        </div>
                    </div>

                    <!-- Message Content -->
                    <div class="p-6">
                        <div v-for="(item, itemIndex) in message.data" :key="itemIndex" class="mb-4 last:mb-0">
                            <!-- Markdown Content -->
                            <div v-if="item.type === 'markdown' || !item.type" 
                                 class="prose max-w-none" 
                                 v-html="renderMarkdown(item.content)">
                            </div>

                            <!-- HTML Content -->
                            <div v-if="item.type === 'html'" 
                                 class="prose max-w-none" 
                                 v-html="item.content">
                            </div>

                            <!-- Notification -->
                            <div v-if="item.type === 'notification'" 
                                 :class="['rounded-lg p-4 flex items-start space-x-3', getNotificationClass(item.content)]">
                                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                </svg>
                                <span class="text-sm">{{ getNotificationText(item.content) }}</span>
                            </div>

                            <!-- Regular Offers (just IDs) -->
                            <div v-if="item.type === 'offers'" class="space-y-3">
                                <div v-if="Array.isArray(item.content) && item.content.length === 0" 
                                     class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    No offers available
                                </div>
                                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <a v-for="offerId in item.content" 
                                       :key="offerId" 
                                       :href="'https://finmatcher.com/offer/' + offerId" 
                                       target="_blank"
                                       class="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group">
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                                                Offer #{{ offerId }}
                                            </span>
                                            <svg class="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            <!-- App Offers (full offer objects) -->
                            <div v-if="item.type === 'app_offers'">
                                <div v-if="!Array.isArray(item.content) || item.content.length === 0" 
                                     class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    No offers available
                                </div>
                                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div v-for="offer in item.content" 
                                         :key="offer.id" 
                                         class="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-md transition-all flex flex-col">
                                        <div class="p-5 flex-1 flex flex-col">
                                            <!-- Offer Header -->
                                            <div class="flex items-start space-x-4 mb-4">
                                                <img :src="offer.avatar || 'https://via.placeholder.com/64'" 
                                                     :alt="offer.name" 
                                                     class="w-16 h-16 rounded-lg object-contain bg-white border border-gray-100 p-2 flex-shrink-0">
                                                <div class="flex-1 min-w-0">
                                                    <h3 class="text-lg font-semibold text-gray-900">{{ offer.name }}</h3>
                                                </div>
                                            </div>

                                            <!-- Offer Details -->
                                            <div v-if="offer.headers && offer.headers.length > 0" class="space-y-3">
                                                <div v-for="header in offer.headers" 
                                                     :key="header.title" 
                                                     class="flex justify-between items-start gap-4 py-2 border-t border-gray-100 first:border-t-0">
                                                    <span class="text-sm text-gray-600 font-medium">{{ header.title }}</span>
                                                    <div class="text-right">
                                                        <span class="text-sm font-semibold text-gray-900 block">{{ header.value }}</span>
                                                        <span v-if="header.additional_term" class="text-xs text-gray-500 block mt-0.5">{{ header.additional_term }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <br/>
                                            <!-- Action Button -->
                                            <a v-if="offer.url" 
                                               :href="offer.url" 
                                               target="_blank" 
                                               rel="noopener noreferrer"
                                               class="mt-auto pt-5 block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors">
                                                Details →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-8 text-center">
                <p class="text-sm text-gray-500">Powered by Finmart and Finmatcher</p>
            </div>
        </div>
    </div>

    <script>
        const { createApp } = Vue;

        createApp({
            data() {
                return {
                    messages: ${JSON.stringify(messagesData)},
                    createdDate: '${chat.created}'
                };
            },
            computed: {
                formattedDate() {
                    return new Date(this.createdDate).toLocaleString();
                }
            },
            methods: {
                renderMarkdown(content) {
                    if (typeof marked !== 'undefined' && marked.parse) {
                        return marked.parse(content);
                    }
                    return content.replace(/\\n/g, '<br>');
                },
                getNotificationClass(content) {
                    const level = typeof content === 'object' ? content.level : 'info';
                    const classes = {
                        'info': 'bg-blue-50 text-blue-800 border border-blue-200',
                        'warning': 'bg-amber-50 text-amber-800 border border-amber-200',
                        'error': 'bg-red-50 text-red-800 border border-red-200',
                        'success': 'bg-green-50 text-green-800 border border-green-200'
                    };
                    return classes[level] || classes.info;
                },
                getNotificationText(content) {
                    if (typeof content === 'string') return content;
                    return content.text || content.title || JSON.stringify(content);
                }
            }
        }).mount('#app');
    </script>
</body>
</html>`;
    }

    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}
