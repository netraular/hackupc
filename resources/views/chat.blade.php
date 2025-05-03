<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}"> {{-- Importante para la seguridad con AJAX en Laravel --}}
    <title>Chat con Agente IA</title>
    <style>
        body { font-family: sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; }
        #chatbox { flex-grow: 1; overflow-y: auto; padding: 20px; border-bottom: 1px solid #ccc; background-color: #f9f9f9; }
        .message { margin-bottom: 15px; padding: 10px 15px; border-radius: 18px; max-width: 70%; line-height: 1.4; }
        .user-message { background-color: #dcf8c6; align-self: flex-end; margin-left: auto; border-bottom-right-radius: 5px;}
        .ai-message { background-color: #fff; align-self: flex-start; border: 1px solid #eee; border-bottom-left-radius: 5px; }
        .message-container { display: flex; flex-direction: column; }
        #chat-form { display: flex; padding: 15px; border-top: 1px solid #ccc; background-color: #eee; }
        #message-input { flex-grow: 1; padding: 10px 15px; border: 1px solid #ccc; border-radius: 20px; margin-right: 10px; font-size: 1em;}
        #send-button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 1em; }
        #send-button:disabled { background-color: #aaa; cursor: not-allowed; }
        .typing-indicator { font-style: italic; color: #888; margin-left: 10px; }
    </style>
</head>
<body>

    <div id="chatbox">
        {{-- Los mensajes del chat se añadirán aquí dinámicamente --}}
        <div class="message-container">
            <div class="message ai-message">
                Hola! Soy tu asistente IA. ¿En qué puedo ayudarte hoy?
            </div>
        </div>
    </div>

    <form id="chat-form">
        {{-- @csrf No es necesario aquí porque lo enviamos en las cabeceras de fetch --}}
        <input type="text" id="message-input" placeholder="Escribe tu mensaje..." autocomplete="off">
        <button type="submit" id="send-button">Enviar</button>
    </form>

    <script>
        const chatbox = document.getElementById('chatbox');
        const chatForm = document.getElementById('chat-form');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content'); // Obtener token CSRF

        // Función para añadir mensajes al chatbox
        function addMessage(text, sender = 'user') {
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container');

            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
            messageDiv.textContent = text; // Usar textContent para seguridad básica

            messageContainer.appendChild(messageDiv);
            chatbox.appendChild(messageContainer);
            chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll hacia abajo
        }

        // Función para mostrar/ocultar indicador de "escribiendo"
        function showTypingIndicator(show = true) {
             let indicator = chatbox.querySelector('.typing-indicator');
             if (show) {
                 if (!indicator) {
                     indicator = document.createElement('div');
                     indicator.classList.add('message-container'); // Usar el mismo contenedor
                     const indicatorBubble = document.createElement('div');
                     indicatorBubble.classList.add('message', 'ai-message', 'typing-indicator');
                     indicatorBubble.textContent = 'Escribiendo...';
                     indicator.appendChild(indicatorBubble);
                     chatbox.appendChild(indicator);
                     chatbox.scrollTop = chatbox.scrollHeight;
                 }
             } else {
                 if (indicator) {
                     indicator.remove();
                 }
             }
         }

        // Manejar el envío del formulario
        chatForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevenir recarga de la página

            const messageText = messageInput.value.trim();
            if (!messageText) return; // No enviar mensajes vacíos

            // Deshabilitar input y botón mientras se procesa
            messageInput.disabled = true;
            sendButton.disabled = true;

            // 1. Mostrar mensaje del usuario inmediatamente
            addMessage(messageText, 'user');
            messageInput.value = ''; // Limpiar input

            // 2. Mostrar indicador de "escribiendo..."
            showTypingIndicator(true);


            try {
                // 3. Enviar mensaje al backend (Laravel) usando fetch
                const response = await fetch('{{ route("chat.send") }}', { // Usa la ruta nombrada de Laravel
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken // Enviar token CSRF
                    },
                    body: JSON.stringify({ message: messageText }) // Enviar como JSON
                });

                 // 4. Ocultar indicador de "escribiendo..."
                showTypingIndicator(false);

                // 5. Procesar la respuesta del backend
                if (response.ok) {
                    const data = await response.json();
                    if (data.reply) {
                        addMessage(data.reply, 'ai'); // Mostrar respuesta del AI
                    } else if (data.error) {
                         addMessage(`Error del servidor: ${data.error}`, 'ai'); // Mostrar error del servidor
                    } else {
                         addMessage('Error: Respuesta inesperada del servidor.', 'ai');
                    }
                } else {
                    // Manejar errores HTTP (4xx, 5xx)
                    const errorData = await response.json().catch(() => ({})); // Intenta parsear error JSON, si falla devuelve objeto vacío
                    const errorMessage = errorData?.error || `Error ${response.status}: ${response.statusText}`;
                    addMessage(`Error al contactar al agente: ${errorMessage}`, 'ai');
                    console.error('Error response:', response);
                }

            } catch (error) {
                // 6. Manejar errores de red u otros errores de fetch
                 showTypingIndicator(false); // Asegurarse de ocultarlo si hay error
                console.error('Error en fetch:', error);
                addMessage('Error de conexión. Inténtalo de nuevo.', 'ai');
            } finally {
                // 7. Reactivar input y botón
                messageInput.disabled = false;
                sendButton.disabled = false;
                messageInput.focus(); // Poner el foco de nuevo en el input
            }
        });

        // Opcional: Enfocar el input al cargar la página
        messageInput.focus();

    </script>

</body>
</html>