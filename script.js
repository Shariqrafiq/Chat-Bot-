// Shariq AI Chatbot - Designed by Shariq Rafiq Anim
// GitHub Mobile Optimized Open-Source AI Chatbot

class LocalAIChatbot {
    constructor() {
        this.model = null;
        this.tokenizer = null;
        this.isModelLoaded = false;
        this.currentModel = 'distilgpt2';
        this.messageHistory = [];
        
        this.init();
    }

    async init() {
        this.cacheDomElements();
        this.bindEvents();
        this.updateStatus('offline', 'Model not loaded');
        await this.checkServiceWorker();
    }

    cacheDomElements() {
        this.messagesContainer = document.getElementById('messages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.modelSelect = document.getElementById('modelSelect');
        this.downloadBtn = document.getElementById('downloadModel');
        this.clearBtn = document.getElementById('clearChat');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.modelBadge = document.getElementById('modelBadge');
        this.charCount = document.getElementById('charCount');
    }

    bindEvents() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.userInput.addEventListener('input', () => {
            const length = this.userInput.value.length;
            this.charCount.textContent = `${length}/500`;
        });

        this.modelSelect.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.updateModelBadge();
        });

        this.downloadBtn.addEventListener('click', () => this.downloadModel());
        this.clearBtn.addEventListener('click', () => this.clearChat());
    }

    updateStatus(status, text) {
        const dot = this.statusIndicator.querySelector('.status-dot');
        dot.className = `status-dot ${status}`;
        this.statusText.textContent = text;
    }

    updateModelBadge() {
        const modelNames = {
            'distilgpt2': 'DistilGPT-2',
            'gpt2': 'GPT-2',
            'flan-t5': 'Flan-T5',
            'bert': 'BERT QA'
        };
        this.modelBadge.textContent = `Model: ${modelNames[this.currentModel]}`;
    }

    async checkServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    async downloadModel() {
        this.updateStatus('loading', 'Downloading model...');
        this.downloadBtn.disabled = true;
        this.downloadBtn.textContent = '⏳ Downloading...';

        try {
            // Use Transformers.js to load the model
            const { pipeline } = window.transformers;
            
            let task = 'text-generation';
            let modelName = 'Xenova/distilgpt2';
            
            switch(this.currentModel) {
                case 'gpt2':
                    modelName = 'Xenova/gpt2';
                    break;
                case 'flan-t5':
                    task = 'text2text-generation';
                    modelName = 'Xenova/flan-t5-small';
                    break;
                case 'bert':
                    task = 'question-answering';
                    modelName = 'Xenova/distilbert-base-uncased-distilled-squad';
                    break;
            }

            // Load the model with progress callback
            this.model = await pipeline(task, modelName, {
                progress_callback: (progress) => {
                    if (progress.status === 'downloading') {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        this.downloadBtn.textContent = `⏳ ${percent}%`;
                    }
                }
            });

            this.isModelLoaded = true;
            this.updateStatus('online', 'Model ready');
            this.downloadBtn.textContent = '✅ Model Loaded';
            
            setTimeout(() => {
                this.downloadBtn.textContent = '📥 Reload Model';
                this.downloadBtn.disabled = false;
            }, 2000);

            this.addBotMessage('Model loaded successfully! I\'m ready to chat with you on GitHub Mobile.');

        } catch (error) {
            console.error('Model download failed:', error);
            this.updateStatus('offline', 'Download failed');
            this.downloadBtn.textContent = '📥 Retry Download';
            this.downloadBtn.disabled = false;
            
            this.addBotMessage('Sorry, I couldn\'t load the model. Please check your connection and try again.');
        }
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addUserMessage(message);
        this.userInput.value = '';
        this.charCount.textContent = '0/500';

        // Show typing indicator
        this.showTyping();

        try {
            let response;

            if (!this.isModelLoaded) {
                // Use basic response if model not loaded
                response = this.generateBasicResponse(message);
            } else {
                // Use the loaded model
                response = await this.generateAIResponse(message);
            }

            // Hide typing and show response
            this.hideTyping();
            this.addBotMessage(response);

        } catch (error) {
            console.error('Error generating response:', error);
            this.hideTyping();
            this.addBotMessage('I apologize, but I encountered an error. Please try again.');
        }
    }

    async generateAIResponse(message) {
        try {
            let result;

            switch(this.currentModel) {
                case 'bert':
                    // For QA model, use a default context
                    const qaResult = await this.model(message, 'This is a conversation with an AI assistant.');
                    result = qaResult.answer || 'I couldn\'t find a specific answer.';
                    break;
                
                case 'flan-t5':
                    const t5Result = await this.model(message);
                    result = t5Result[0].generated_text;
                    break;
                
                default:
                    // Text generation models
                    const genResult = await this.model(message, {
                        max_new_tokens: 100,
                        temperature: 0.7,
                        do_sample: true
                    });
                    result = genResult[0].generated_text;
                    // Remove the input from the output
                    result = result.replace(message, '').trim();
            }

            return result || 'I processed your message but couldn\'t generate a meaningful response.';

        } catch (error) {
            console.error('AI generation error:', error);
            return this.generateBasicResponse(message);
        }
    }

    generateBasicResponse(message) {
        // Basic response system when model isn't loaded
        const responses = {
            'hello': 'Hello! I\'m Shariq AI. How can I assist you today?',
            'hi': 'Hi there! Ready to help you on GitHub Mobile.',
            'how are you': 'I\'m running locally in your browser, so I\'m always ready! How can I help?',
            'help': 'I can help with general questions, coding assistance, and conversations. Try downloading a model for better responses!',
            'who created you': 'I was created and designed by Shariq Rafiq Anim, optimized for GitHub Mobile.',
            'what is your name': 'I\'m Shariq AI Chatbot, your open-source local AI assistant!',
            'bye': 'Goodbye! Feel free to chat anytime. I\'m always here on your mobile!',
        };

        const lowerMessage = message.toLowerCase();
        for (const [key, value] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return value;
            }
        }

        return `I received your message: "${message}". For better responses, please download an AI model first. You can select from DistilGPT-2, GPT-2, Flan-T5, or BERT models above.`;
    }

    addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
            </div>
        `;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="bot-avatar">🤖</div>
                <div class="message-text">
                    <strong>Shariq AI:</strong> ${this.escapeHtml(text)}
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTyping() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTyping() {
        this.typingIndicator.style.display = 'none';
    }

    clearChat() {
        this.messagesContainer.innerHTML = `
            <div class="message bot-message">
                <div class="message-content">
                    <div class="bot-avatar">🤖</div>
                    <div class="message-text">
                        <strong>Shariq AI:</strong> Chat cleared! How can I help you?
                    </div>
                </div>
            </div>
        `;
    }

    scrollToBottom() {
        const chatContainer = document.querySelector('.chat-container');
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new LocalAIChatbot();
    
    // Register for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});
