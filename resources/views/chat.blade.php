<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Chat con Agente IA (Texto)</title>
    <style>
        /* Estilos existentes... (sin cambios necesarios aquí a menos que quieras quitar espacio del micro) */
        body { font-family: sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; background-color: #f0f0f0; }
        #chatbox { flex-grow: 1; overflow-y: auto; padding: 20px; border-bottom: 1px solid #ccc; background-color: #e5ddd5; display: flex; flex-direction: column;}
        .message-container { display: flex; margin-bottom: 10px; max-width: 80%; }
        .message { padding: 8px 12px; border-radius: 7.5px; line-height: 1.4; box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13); word-wrap: break-word; }
        .user-message-container { align-self: flex-end; margin-left: auto; }
        .ai-message-container { align-self: flex-start; margin-right: auto; }
        .user-message { background-color: #dcf8c6; }
        .ai-message { background-color: #fff; }
        #chat-form { display: flex; padding: 10px; border-top: 1px solid #ccc; background-color: #f0f0f0; align-items: center; }
        #message-input { flex-grow: 1; padding: 10px 15px; border: 1px solid #ccc; border-radius: 20px; margin-right: 10px; font-size: 1em; background-color: #fff; }
        #controls-container { display: flex; align-items: center; }
        .chat-button { background: none; border: none; padding: 8px; cursor: pointer; font-size: 1.5em; color: #54656f; transition: color 0.2s; }
        .chat-button:hover { color: #007bff; }
        .chat-button:disabled { color: #aaa; cursor: not-allowed; }
        .typing-indicator { font-style: italic; color: #888; margin-left: 10px; }
        /* Ya no se necesita el estilo .play-tts-button */

    </style>
     <!-- Font Awesome para el icono de enviar -->
     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>

    <div id="chatbox">
        <div class="ai-message-container message-container">
            <div class="message ai-message">
                Hello! I'm your AI assistant. How can I help you today? (Text only)
            </div>
        </div>
    </div>

    <form id="chat-form">
        <input type="text" id="message-input" placeholder="Type your message..." autocomplete="off">
        <div id="controls-container">
             <!-- Botón de micrófono eliminado -->
             <button type="submit" id="send-button" class="chat-button" title="Send Message">
                 <i class="fas fa-paper-plane"></i>
             </button>
        </div>
    </form>

    <script>
        const chatbox = document.getElementById('chatbox');
        const chatForm = document.getElementById('chat-form');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        // const recordButton = document.getElementById('record-button'); // Eliminado
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        // Variables y lógica de MediaRecorder eliminadas
        // let mediaRecorder;
        // let audioChunks = [];
        // let isRecording = false;
        // let currentPlayingAudio = null; // Eliminado

        // Iconos SVG y clases de micrófono/grabación eliminados

        // Función para añadir mensajes (simplificada, sin audioBase64)
        function addMessage(text, sender = 'user') {
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container', sender === 'user' ? 'user-message-container' : 'ai-message-container');

            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
            messageDiv.textContent = text; // Usa textContent para seguridad

            // Lógica del botón Play TTS eliminada

            messageContainer.appendChild(messageDiv);
            chatbox.appendChild(messageContainer);
            scrollToBottom(); // Auto-scroll hacia abajo
        }

        function scrollToBottom() {
             chatbox.scrollTop = chatbox.scrollHeight;
        }

        function showTypingIndicator(show = true) {
             let indicator = chatbox.querySelector('.typing-indicator-container');
             if (show) {
                 if (!indicator) {
                     indicator = document.createElement('div');
                     indicator.classList.add('message-container', 'ai-message-container', 'typing-indicator-container');
                     const indicatorBubble = document.createElement('div');
                     indicatorBubble.classList.add('message', 'ai-message', 'typing-indicator');
                     indicatorBubble.textContent = 'Agent is typing...';
                     indicator.appendChild(indicatorBubble);
                     chatbox.appendChild(indicator);
                     scrollToBottom();
                 }
             } else {
                 if (indicator) {
                     indicator.remove();
                 }
             }
        }

         // Habilitar/deshabilitar controles (simplificado)
         function setControlsEnabled(enabled) {
             messageInput.disabled = !enabled;
             sendButton.disabled = !enabled;
             // recordButton.disabled = !enabled; // Eliminado
             messageInput.style.opacity = enabled ? 1 : 0.6;
             sendButton.style.opacity = enabled ? 1 : 0.6;
             // recordButton.style.opacity = enabled ? 1 : 0.6; // Eliminado
         }

        // Funciones startRecording, stopRecording, setRecordingUI eliminadas
        // Event listener de recordButton eliminado

        // --- Manejo de Envío (Solo Texto) ---
        chatForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const messageText = messageInput.value.trim();
            if (!messageText) return;

            setControlsEnabled(false);
            addMessage(messageText, 'user');
            messageInput.value = '';
            showTypingIndicator(true);

             // Enviar texto como JSON
            const dataToSend = JSON.stringify({ message: messageText });
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            };

            await sendData(dataToSend, headers);
        });

        // Función genérica para enviar datos (ahora solo JSON)
         async function sendData(jsonData, headers) {
             try {
                 const response = await fetch('{{ route("chat.send") }}', {
                     method: 'POST',
                     headers: headers,
                     body: jsonData // Siempre enviamos JSON
                 });

                 showTypingIndicator(false);

                 const responseData = await response.json(); // Siempre esperamos JSON

                 if (response.ok) {
                      if (responseData.reply) {
                         // Añadir mensaje solo con texto
                         addMessage(responseData.reply, 'ai');
                     } else {
                         // Si la respuesta fue 200 OK pero no tiene 'reply', es un error inesperado
                          addMessage(`Server Error: Unexpected response format.`, 'ai');
                          console.error('Unexpected success response:', responseData);
                     }
                 } else {
                      // Construye el mensaje de error
                     const errorMessage = responseData?.reply || responseData?.error || `Error ${response.status}`;
                     addMessage(`${errorMessage}`, 'ai'); // Mostrar mensaje de error como mensaje AI
                     console.error('Error response status:', response.status, 'Error data parsed:', responseData);
                 }

             } catch (error) {
                 showTypingIndicator(false);
                 console.error('Fetch Error:', error);
                 addMessage('Connection error. Please try again.', 'ai');
             } finally {
                 setControlsEnabled(true);
                 messageInput.focus();
             }
         }

        // Enfocar input al cargar
        messageInput.focus();
        scrollToBottom(); // Asegurar scroll inicial

    </script>

</body>
</html>