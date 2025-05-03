// public/js/3d_experience/chatIntegration.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Verificación de que estamos en la página correcta (opcional pero bueno) ---
    // Busca elementos específicos del chat en el panel FAB
    const chatbox = document.querySelector('#panel-section-chat #chatbox');
    const chatForm = document.querySelector('#panel-section-chat #chat-form');

    // Si no se encuentran los elementos del chat, no ejecuta el resto del script
    if (!chatbox || !chatForm) {
        // console.log("Elementos del chat no encontrados en esta página/panel. Script de chat no inicializado.");
        return;
    }

    console.log("Inicializando script de integración del Chat...");

    // --- Obtener elementos del DOM dentro del contexto del chat ---
    const messageInput = chatForm.querySelector('#message-input');
    const sendButton = chatForm.querySelector('#send-button');
    // const controlsContainer = chatForm.querySelector('#controls-container'); // Si lo necesitas

    // --- Obtener configuración global ---
    // Asegúrate de que window.ExperienceConfig y sus propiedades existan
    const chatSendUrl = window.ExperienceConfig?.chatSendUrl;
    const csrfToken = window.ExperienceConfig?.csrfToken;

    if (!chatSendUrl || !csrfToken) {
        console.error("Error: Falta chatSendUrl o csrfToken en window.ExperienceConfig.");
        // Podrías deshabilitar el chat aquí si falta la config
        if(messageInput) messageInput.disabled = true;
        if(sendButton) sendButton.disabled = true;
        if(messageInput) messageInput.placeholder = "Chat deshabilitado (configuración faltante)";
        // Añadir un mensaje visual en el chatbox
        addMessage("El chat no está disponible debido a un error de configuración.", 'ai');
        return; // Detener la ejecución si falta la configuración esencial
    }

    // --- Funciones del Chat (Copiadas y adaptadas de chat.blade.php) ---

    function addMessage(text, sender = 'user') {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container', sender === 'user' ? 'user-message-container' : 'ai-message-container');

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageDiv.textContent = text; // Usar textContent por seguridad

        messageContainer.appendChild(messageDiv);
        chatbox.appendChild(messageContainer);
        scrollToBottom(); // Auto-scroll hacia abajo
    }

    function scrollToBottom() {
        // Pequeño retraso para asegurar que el DOM se actualizó antes de hacer scroll
        setTimeout(() => {
             if(chatbox) {
                 chatbox.scrollTop = chatbox.scrollHeight;
             }
        }, 50);
    }

    function showTypingIndicator(show = true) {
        // Asegura buscar el indicador dentro del chatbox correcto
        let indicator = chatbox.querySelector('.typing-indicator-container');
        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.classList.add('message-container', 'ai-message-container', 'typing-indicator-container');
                const indicatorBubble = document.createElement('div');
                indicatorBubble.classList.add('message', 'ai-message', 'typing-indicator');
                indicatorBubble.textContent = 'Thinking...'; // Texto actualizado
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

    function setControlsEnabled(enabled) {
        if (messageInput) {
            messageInput.disabled = !enabled;
            messageInput.style.opacity = enabled ? 1 : 0.6;
        }
        if (sendButton) {
            sendButton.disabled = !enabled;
            sendButton.style.opacity = enabled ? 1 : 0.6;
        }
        // Si el formulario en sí debe ser deshabilitado:
        // if (chatForm) {
        //     chatForm.style.pointerEvents = enabled ? 'auto' : 'none';
        // }
    }

    // --- Manejo de Envío (Solo Texto) ---
    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!messageInput || messageInput.disabled) return; // Comprobar si está deshabilitado

        const messageText = messageInput.value.trim();
        if (!messageText) return;

        setControlsEnabled(false);
        addMessage(messageText, 'user');
        messageInput.value = '';
        showTypingIndicator(true);

        const dataToSend = JSON.stringify({ message: messageText });
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken // Usar el token de la config global
        };

        await sendData(dataToSend, headers);
    });

    // --- Función genérica para enviar datos ---
    async function sendData(jsonData, headers) {
        try {
            const response = await fetch(chatSendUrl, { // Usar la URL de la config global
                method: 'POST',
                headers: headers,
                body: jsonData
            });

            showTypingIndicator(false);

            // Intentar siempre parsear como JSON, incluso si hay error
            let responseData = {};
             try {
                responseData = await response.json();
             } catch (e) {
                 // Si falla el parseo JSON (ej. respuesta HTML de error 500)
                 console.error("Error parsing JSON response:", e);
                 // Intenta obtener el texto de la respuesta para más info
                 const responseText = await response.text();
                 console.error("Response Text:", responseText);
                 // Crear un objeto de error simulado
                 responseData = { error: `Error ${response.status}: Invalid response from server.` };
                 // Lanza un error para que sea capturado por el catch externo si prefieres
                 // throw new Error(`Error ${response.status}: Invalid response from server.`);
             }


            if (response.ok) {
                if (responseData.reply) {
                    addMessage(responseData.reply, 'ai');
                } else {
                    // Respuesta OK pero formato inesperado
                    addMessage("Error: Respuesta inesperada del servidor.", 'ai');
                    console.error('Unexpected success response format:', responseData);
                }
            } else {
                // Construir mensaje de error desde la respuesta JSON o estado HTTP
                const errorMessage = responseData?.reply || responseData?.error || `Error ${response.status}`;
                addMessage(`Error: ${errorMessage}`, 'ai'); // Mostrar mensaje de error
                console.error('Error response status:', response.status, 'Error data parsed:', responseData);
            }

        } catch (error) {
            showTypingIndicator(false);
            console.error('Fetch Error:', error);
            // Mostrar error de conexión genérico
            addMessage('Error de conexión. Por favor, inténtalo de nuevo.', 'ai');
        } finally {
            setControlsEnabled(true);
            if (messageInput) {
                 messageInput.focus(); // Intentar volver a enfocar
            }
        }
    }

    // --- Inicialización del Chat ---
    if (messageInput) {
        messageInput.focus(); // Enfocar input al cargar y si el panel se hace visible
    }
    scrollToBottom(); // Asegurar scroll inicial

    console.log("Script de integración del Chat inicializado correctamente.");

    // Opcional: Re-enfocar el input cuando la pestaña del chat se activa
    const chatTab = document.querySelector('.panel-nav-tab[data-target="panel-section-chat"]');
    if(chatTab && messageInput) {
        chatTab.addEventListener('click', () => {
            // Pequeño retraso para asegurar que la sección es visible
            setTimeout(() => messageInput.focus(), 100);
        });
    }

}); // Fin del DOMContentLoaded