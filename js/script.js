// Konfigurasi DeepSeek API
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';

// Elemen DOM
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-chat');
const charCount = document.getElementById('char-count');
const statusElement = document.getElementById('status');
const loadingElement = document.getElementById('loading');
const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key');

// State
let apiKey = localStorage.getItem('deepseek_api_key') || '';
let conversationHistory = JSON.parse(localStorage.getItem('chat_history')) || [
    {
        role: 'assistant',
        content: 'Halo! Saya DeepSeek AI. Ada yang bisa saya bantu?'
    }
];

// Inisialisasi
function init() {
    // Load API key
    if (apiKey) {
        apiKeyInput.value = '••••••••••••••••••••';
        statusElement.textContent = 'Status: API Key loaded';
        statusElement.style.color = '#28a745';
    }
    
    // Load chat history
    renderChatHistory();
    
    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter (with Shift for new line)
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Character count
    userInput.addEventListener('input', updateCharCount);
    
    // Clear chat
    clearBtn.addEventListener('click', clearChat);
    
    // Save API key
    saveKeyBtn.addEventListener('click', saveApiKey);
    
    // Show actual API key on focus
    apiKeyInput.addEventListener('focus', () => {
        if (apiKeyInput.value === '••••••••••••••••••••') {
            apiKeyInput.type = 'text';
            apiKeyInput.value = apiKey;
        }
    });
    
    // Hide API key on blur
    apiKeyInput.addEventListener('blur', () => {
        if (apiKeyInput.value === apiKey && apiKey) {
            apiKeyInput.type = 'password';
            apiKeyInput.value = '••••••••••••••••••••';
        }
    });
}

// Update character count
function updateCharCount() {
    const count = userInput.value.length;
    charCount.textContent = count;
    
    if (count > 4000) {
        charCount.style.color = '#ff4757';
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
    } else {
        charCount.style.color = '#6c757d';
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
    }
}

// Save API key
function saveApiKey() {
    const key = apiKeyInput.value.trim();
    
    if (!key) {
        alert('Please enter your DeepSeek API key');
        return;
    }
    
    if (key.startsWith('sk-') && key.length > 30) {
        apiKey = key;
        localStorage.setItem('deepseek_api_key', key);
        
        apiKeyInput.type = 'password';
        apiKeyInput.value = '••••••••••••••••••••';
        
        statusElement.textContent = 'Status: API Key saved successfully';
        statusElement.style.color = '#28a745';
        
        showNotification('API Key saved successfully!', 'success');
    } else {
        alert('Invalid API key format. Please check your key.');
    }
}

// Send message to DeepSeek API
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) {
        alert('Please enter a message');
        return;
    }
    
    if (!apiKey) {
        alert('Please save your API key first');
        apiKeyInput.focus();
        return;
    }
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    userInput.value = '';
    updateCharCount();
    
    // Show loading
    setLoading(true);
    
    try {
        // Add user message to history
        conversationHistory.push({
            role: 'user',
            content: message
        });
        
        // Call DeepSeek API
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: conversationHistory,
                max_tokens: 2000,
                temperature: 0.7,
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Get AI response
        const aiResponse = data.choices[0].message.content;
        
        // Add AI response to chat
        addMessageToChat('assistant', aiResponse);
        
        // Update conversation history
        conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
        
        // Save to localStorage
        localStorage.setItem('chat_history', JSON.stringify(conversationHistory));
        
        // Update status
        statusElement.textContent = 'Status: Response received';
        statusElement.style.color = '#28a745';
        
    } catch (error) {
        console.error('Error:', error);
        
        // Show error in chat
        addMessageToChat('assistant', `Error: ${error.message}. Please check your API key and connection.`);
        
        // Update status
        statusElement.textContent = 'Status: Error occurred';
        statusElement.style.color = '#ff4757';
        
        showNotification('Failed to get response. Check console for details.', 'error');
    } finally {
        setLoading(false);
    }
}

// Add message to chat UI
function addMessageToChat(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'ai-message'}`;
    
    const timestamp = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="avatar">
            <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
        </div>
        <div class="content">
            <p>${formatMessage(message)}</p>
            <span class="timestamp">${timestamp}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Format message (preserve line breaks and code)
function formatMessage(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// Render chat history
function renderChatHistory() {
    chatMessages.innerHTML = '';
    
    conversationHistory.forEach(message => {
        if (message.role === 'assistant' || message.role === 'user') {
            addMessageToChat(message.role, message.content);
        }
    });
}

// Clear chat history
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        conversationHistory = [{
            role: 'assistant',
            content: 'Halo! Saya DeepSeek AI. Ada yang bisa saya bantu?'
        }];
        
        localStorage.setItem('chat_history', JSON.stringify(conversationHistory));
        renderChatHistory();
        
        showNotification('Chat history cleared', 'info');
    }
}

// Scroll to bottom of chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Set loading state
function setLoading(isLoading) {
    if (isLoading) {
        loadingElement.classList.remove('hidden');
        statusElement.textContent = 'Status: Processing...';
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    } else {
        loadingElement.classList.add('hidden');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim';
    }
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#ff4757' : '#667eea'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Add keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);