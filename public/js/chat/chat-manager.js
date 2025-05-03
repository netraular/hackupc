export class ChatManager {
    constructor() {
        this.chatContainer = document.getElementById('chatHistory');
        this.currentStreamingMessage = null;
        this.lastUserMessageType = null; // 'text' or 'audio'
        this.currentTranscript = ''; // Add this to store accumulated transcript
        this.chatHistory = []; // Array to store chat history
        
        // Load chat history from localStorage if available
        this.loadChatHistory();
    }

    // Save a message to chat history
    saveMessage(role, content, type = 'text') {
        const message = {
            role, // 'user' or 'model'
            content,
            type,
            timestamp: new Date().toISOString()
        };
        this.chatHistory.push(message);
        this.saveChatHistory();
        return message;
    }

    // Save chat history to localStorage
    saveChatHistory() {
        try {
            localStorage.setItem('geminiChatHistory', JSON.stringify(this.chatHistory));
            console.log('Chat history saved to localStorage');
        } catch (error) {
            console.error('Failed to save chat history to localStorage:', error);
        }
    }

    // Load chat history from localStorage
    loadChatHistory() {
        try {
            const savedHistory = localStorage.getItem('geminiChatHistory');
            if (savedHistory) {
                this.chatHistory = JSON.parse(savedHistory);
                console.log('Chat history loaded from localStorage');
                
                // Populate UI with saved messages
                this.renderSavedHistory();
            } else {
                this.chatHistory = [];
            }
        } catch (error) {
            console.error('Failed to load chat history from localStorage:', error);
            this.chatHistory = [];
        }
    }

    // Render saved chat history in the UI
    renderSavedHistory() {
        // Clear existing chat container first
        this.chatContainer.innerHTML = '';
        
        // Render each message from history
        this.chatHistory.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.textContent = message.content;
            
            if (message.role === 'user') {
                messageDiv.className = 'chat-message user-message';
            } else {
                messageDiv.className = 'chat-message model-message';
            }
            
            this.chatContainer.appendChild(messageDiv);
        });
        
        this.scrollToBottom();
    }

    addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user-message';
        messageDiv.textContent = text;
        this.chatContainer.appendChild(messageDiv);
        this.lastUserMessageType = 'text';
        
        // Save to history
        this.saveMessage('user', text, 'text');
        
        this.scrollToBottom();
    }

    addUserAudioMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user-message';
        messageDiv.textContent = 'User sent audio';
        this.chatContainer.appendChild(messageDiv);
        this.lastUserMessageType = 'audio';
        
        // Save to history
        this.saveMessage('user', 'User sent audio', 'audio');
        
        this.scrollToBottom();
    }

    startModelMessage() {
        // If there's already a streaming message, finalize it first
        if (this.currentStreamingMessage) {
            this.finalizeStreamingMessage();
        }

        // If no user message was shown yet, show audio message
        if (!this.lastUserMessageType) {
            this.addUserAudioMessage();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message model-message streaming';
        this.chatContainer.appendChild(messageDiv);
        this.currentStreamingMessage = messageDiv;
        this.currentTranscript = ''; // Reset transcript when starting new message
        this.scrollToBottom();
    }

    updateStreamingMessage(text) {
        if (!this.currentStreamingMessage) {
            this.startModelMessage();
        }
        this.currentTranscript += ' ' + text; // Append new text to the transcript
        this.currentStreamingMessage.textContent = this.currentTranscript;
        this.scrollToBottom();
    }

    finalizeStreamingMessage() {
        if (this.currentStreamingMessage) {
            this.currentStreamingMessage.classList.remove('streaming');
            
            // Save the finalized model response to history
            if (this.currentTranscript.trim()) {
                this.saveMessage('model', this.currentTranscript.trim(), 'text');
            }
            
            this.currentStreamingMessage = null;
            this.lastUserMessageType = null;
            this.currentTranscript = ''; // Reset transcript when finalizing
        }
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    clear() {
        this.chatContainer.innerHTML = '';
        this.currentStreamingMessage = null;
        this.lastUserMessageType = null;
        this.currentTranscript = '';
        
        // Clear history in memory and storage
        this.chatHistory = [];
        this.saveChatHistory();
    }
    
    // Get the complete chat history
    getChatHistory() {
        return [...this.chatHistory]; // Return a copy of the history array
    }
    
    // Export chat history as JSON string
    exportChatHistory() {
        return JSON.stringify(this.chatHistory);
    }
}