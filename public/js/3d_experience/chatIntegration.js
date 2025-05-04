// public/js/3d_experience/chatIntegration.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Verificación de que estamos en la página correcta ---
    const chatSection = document.getElementById('panel-section-chat');
    if (!chatSection) {
        // console.log("Sección de chat no encontrada. Script de chat no inicializado.");
        return;
    }

    const chatbox = chatSection.querySelector('#chatbox');
    const chatForm = chatSection.querySelector('#chat-form');
    const messageInput = chatSection.querySelector('#message-input');
    const sendButton = chatSection.querySelector('#send-button');
    const muteToggleButton = chatSection.querySelector('#mute-toggle-button');

    if (!chatbox || !chatForm || !messageInput || !sendButton || !muteToggleButton) {
        console.error("CHAT_TTS_LOG: Faltan elementos esenciales del chat en el DOM.");
        return;
    }

    console.log("CHAT_TTS_LOG: Inicializando script de integración del Chat con TTS...");

    // --- Obtener configuración global ---
    const chatSendUrl = window.ExperienceConfig?.chatSendUrl;
    const ttsSynthesizeUrl = window.ExperienceConfig?.ttsSynthesizeUrl;
    const csrfToken = window.ExperienceConfig?.csrfToken;

    if (!chatSendUrl || !csrfToken || !ttsSynthesizeUrl) {
        console.error("CHAT_TTS_LOG: Error: Falta config esencial (chatSendUrl, ttsSynthesizeUrl o csrfToken).");
        addMessage("El chat o la función de audio no están disponibles debido a un error de configuración.", 'ai');
        setControlsEnabled(false);
        messageInput.placeholder = "Chat deshabilitado (configuración faltante)";
        return;
    }
    console.log("CHAT_TTS_LOG: Configuración cargada:", { chatSendUrl, ttsSynthesizeUrl, csrfToken: '******' }); // No loguear token completo


    // --- Estado del Chat y TTS ---
    let isMuted = false;
    let currentAudio = null; // Para manejar la reproducción de audio

    // --- Funciones del Chat (sin cambios) ---
    function addMessage(text, sender = 'user') {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container', sender === 'user' ? 'user-message-container' : 'ai-message-container');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageDiv.textContent = text;
        messageContainer.appendChild(messageDiv);
        chatbox.appendChild(messageContainer);
        scrollToBottom();
    }
    function scrollToBottom() {
        setTimeout(() => { if(chatbox) chatbox.scrollTop = chatbox.scrollHeight; }, 50);
    }
    function showTypingIndicator(show = true) {
        let indicator = chatbox.querySelector('.typing-indicator-container');
        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.classList.add('message-container', 'ai-message-container', 'typing-indicator-container');
                const indicatorBubble = document.createElement('div');
                indicatorBubble.classList.add('message', 'ai-message', 'typing-indicator');
                indicatorBubble.textContent = 'Thinking...';
                indicator.appendChild(indicatorBubble);
                chatbox.appendChild(indicator);
                scrollToBottom();
            }
        } else {
            if (indicator) indicator.remove();
        }
    }
    function setControlsEnabled(enabled) {
        messageInput.disabled = !enabled;
        messageInput.style.opacity = enabled ? 1 : 0.6;
        sendButton.disabled = !enabled;
        sendButton.style.opacity = enabled ? 1 : 0.6;
    }

    // --- Función para obtener y reproducir TTS ---
    async function fetchAndPlayTTS(text) {
        console.log("CHAT_TTS_LOG: Entrando en fetchAndPlayTTS."); // <-- LOG INICIO FUNCIÓN

        if (isMuted) {
            console.log("CHAT_TTS_LOG: TTS está muteado. Saltando reproducción."); // <-- LOG MUTEADO
            return;
        }
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
             console.log("CHAT_TTS_LOG: No hay texto válido para TTS. Texto recibido:", text); // <-- LOG TEXTO INVÁLIDO
             return;
        }

        console.log("CHAT_TTS_LOG: Deteniendo audio previo (si existe).");
        stopCurrentAudio();

        const textExcerpt = text.substring(0, 80) + (text.length > 80 ? "..." : "");
        console.log(`CHAT_TTS_LOG: Solicitando TTS para: "${textExcerpt}"`); // <-- LOG TEXTO A SINTETIZAR

        // Opcional: Mostrar un indicador de carga de audio
        // showAudioLoadingIndicator(true);

        try {
            console.log(`CHAT_TTS_LOG: Haciendo fetch a TTS API: ${ttsSynthesizeUrl}`); // <-- LOG ANTES DE FETCH
            const response = await fetch(ttsSynthesizeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ text: text })
            });

            console.log(`CHAT_TTS_LOG: Respuesta recibida de TTS API. Status: ${response.status}`); // <-- LOG STATUS RESPUESTA

            // showAudioLoadingIndicator(false);

            if (!response.ok) {
                 let errorData = {};
                 try {
                     errorData = await response.json();
                     console.error(`CHAT_TTS_LOG: Error en TTS API (${response.status}). Respuesta JSON:`, errorData); // <-- LOG ERROR JSON
                 } catch (e) {
                     const errorText = await response.text();
                     console.error(`CHAT_TTS_LOG: Error en TTS API (${response.status}). No se pudo parsear JSON. Respuesta Texto:`, errorText); // <-- LOG ERROR TEXTO
                 }
                // No mostramos error en el chat, solo log
                return;
            }

            const result = await response.json();
            console.log("CHAT_TTS_LOG: Respuesta TTS parseada correctamente."); // <-- LOG PARSEO OK

            if (result.audio_base64) {
                console.log(`CHAT_TTS_LOG: audio_base64 recibido (longitud: ${result.audio_base64.length}). MimeType: ${result.mime_type}`); // <-- LOG BASE64 OK
                const audioDataUrl = `data:${result.mime_type || 'audio/mpeg'};base64,${result.audio_base64}`;
                // console.log("CHAT_TTS_LOG: Audio Data URL creada:", audioDataUrl.substring(0, 100) + "..."); // <-- LOG DATA URL (puede ser muy larga)

                currentAudio = new Audio(audioDataUrl);
                console.log("CHAT_TTS_LOG: Objeto Audio creado."); // <-- LOG AUDIO OBJECT CREADO

                currentAudio.addEventListener('canplaythrough', () => {
                    console.log("CHAT_TTS_LOG: Evento 'canplaythrough' recibido. Listo para reproducir."); // <-- LOG LISTO PARA PLAY
                });

                currentAudio.addEventListener('ended', () => {
                    console.log("CHAT_TTS_LOG: Evento 'ended'. Reproducción TTS finalizada."); // <-- LOG FIN REPRODUCCIÓN
                    currentAudio = null; // Liberar referencia
                });
                currentAudio.addEventListener('error', (e) => {
                    console.error("CHAT_TTS_LOG: Evento 'error' en el objeto Audio:", e); // <-- LOG ERROR AUDIO ELEMENT
                    currentAudio = null; // Liberar referencia en caso de error
                });
                currentAudio.addEventListener('pause', () => {
                    console.log("CHAT_TTS_LOG: Evento 'pause' en el objeto Audio."); // <-- LOG PAUSA AUDIO
                });
                 currentAudio.addEventListener('stalled', () => {
                    console.warn("CHAT_TTS_LOG: Evento 'stalled' en el objeto Audio. Problema cargando datos?"); // <-- LOG STALLED
                });


                // Intenta reproducir y captura errores específicos de play()
                try {
                     console.log("CHAT_TTS_LOG: Llamando a currentAudio.play()..."); // <-- LOG ANTES DE PLAY
                     await currentAudio.play();
                     console.log("CHAT_TTS_LOG: Reproducción iniciada (promesa resuelta)."); // <-- LOG PLAY INICIADO
                } catch (playError) {
                    console.error("CHAT_TTS_LOG: Error al llamar a play():", playError); // <-- LOG ERROR EN PLAY
                     // Posibles causas: interacción del usuario no detectada, política del navegador, etc.
                     // Podríamos intentar mostrar un botón de "Reproducir" aquí si falla automáticamente.
                     currentAudio = null; // Limpiar si no se pudo reproducir
                }

            } else {
                console.error("CHAT_TTS_LOG: Respuesta TTS OK pero sin 'audio_base64'. Resultado:", result); // <-- LOG SIN BASE64
            }

        } catch (error) {
            console.error('CHAT_TTS_LOG: Error en el bloque try/catch de fetchAndPlayTTS:', error); // <-- LOG ERROR FETCH/GENERAL
            // showAudioLoadingIndicator(false);
        }
    }

    // --- Función para detener el audio actual ---
    function stopCurrentAudio() {
        if (currentAudio) {
            console.log("CHAT_TTS_LOG: stopCurrentAudio() - Deteniendo y limpiando audio actual."); // <-- LOG STOP AUDIO
            currentAudio.pause();
            currentAudio.src = ''; // Descarga el recurso
            // Eliminar listeners para evitar fugas de memoria
            currentAudio.removeEventListener('canplaythrough', null);
            currentAudio.removeEventListener('ended', null);
            currentAudio.removeEventListener('error', null);
            currentAudio.removeEventListener('pause', null);
            currentAudio.removeEventListener('stalled', null);
            currentAudio = null;
        } else {
             // console.log("CHAT_TTS_LOG: stopCurrentAudio() - No hay audio actual para detener."); // Log opcional
        }
    }

    // --- Manejo de Envío de Mensaje ---
    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (messageInput.disabled) return;
        const messageText = messageInput.value.trim();
        if (!messageText) return;

        console.log("CHAT_TTS_LOG: Formulario enviado. Mensaje:", messageText); // <-- LOG ENVÍO FORM
        setControlsEnabled(false);
        addMessage(messageText, 'user');
        messageInput.value = '';
        showTypingIndicator(true);
        console.log("CHAT_TTS_LOG: Llamando a stopCurrentAudio() desde submit handler."); // <-- LOG STOP ANTES DE ENVIAR
        stopCurrentAudio();

        const dataToSend = JSON.stringify({ message: messageText });
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        };

        console.log("CHAT_TTS_LOG: Llamando a sendData()."); // <-- LOG LLAMADA SENDDATA
        await sendData(dataToSend, headers);
    });

    // --- Función genérica para enviar datos y manejar respuesta ---
    async function sendData(jsonData, headers) {
        console.log("CHAT_TTS_LOG: Entrando en sendData()."); // <-- LOG INICIO SENDDATA
        try {
            console.log(`CHAT_TTS_LOG: Haciendo fetch a Chat API: ${chatSendUrl}`); // <-- LOG ANTES FETCH CHAT
            const response = await fetch(chatSendUrl, {
                method: 'POST',
                headers: headers,
                body: jsonData
            });
            console.log(`CHAT_TTS_LOG: Respuesta recibida de Chat API. Status: ${response.status}`); // <-- LOG STATUS CHAT

            showTypingIndicator(false);

            let responseData = {};
            try {
                responseData = await response.json();
                 console.log("CHAT_TTS_LOG: Respuesta Chat API parseada:", responseData); // <-- LOG PARSEO CHAT OK
            } catch (e) {
                console.error("CHAT_TTS_LOG: Error parseando JSON de Chat API:", e);
                const responseText = await response.text();
                console.error("CHAT_TTS_LOG: Respuesta Texto Chat API:", responseText);
                responseData = { error: `Error ${response.status}: Invalid response from server.` };
            }

            if (response.ok && responseData.reply) {
                const aiReplyText = responseData.reply;
                console.log("CHAT_TTS_LOG: Respuesta AI recibida:", aiReplyText); // <-- LOG RESPUESTA AI
                addMessage(aiReplyText, 'ai');

                // --- LLAMAR A TTS DESPUÉS DE RECIBIR LA RESPUESTA ---
                console.log("CHAT_TTS_LOG: Llamando a fetchAndPlayTTS() desde sendData() con la respuesta AI."); // <-- LOG ANTES LLAMADA TTS
                await fetchAndPlayTTS(aiReplyText);
                // --------------------------------------------------

            } else {
                const errorMessage = responseData?.reply || responseData?.error || `Error ${response.status}`;
                 console.error("CHAT_TTS_LOG: Error en la respuesta de Chat API o formato inesperado:", errorMessage, responseData); // <-- LOG ERROR CHAT API
                addMessage(`Error: ${errorMessage}`, 'ai');
                console.log("CHAT_TTS_LOG: Llamando a stopCurrentAudio() debido a error en Chat API."); // <-- LOG STOP POR ERROR
                stopCurrentAudio();
            }

        } catch (error) {
            showTypingIndicator(false);
            console.error('CHAT_TTS_LOG: Error en bloque try/catch de sendData (Fetch Error):', error); // <-- LOG ERROR FETCH/GENERAL SENDDATA
            addMessage('Error de conexión. Por favor, inténtalo de nuevo.', 'ai');
            console.log("CHAT_TTS_LOG: Llamando a stopCurrentAudio() debido a error de conexión."); // <-- LOG STOP POR ERROR CONEXIÓN
            stopCurrentAudio();
        } finally {
            console.log("CHAT_TTS_LOG: Bloque finally de sendData. Habilitando controles."); // <-- LOG FINALLY
            setControlsEnabled(true);
            if (messageInput) {
                messageInput.focus();
            }
        }
    }

    // --- Manejo del Botón de Silencio/Activación ---
    function updateMuteButtonVisuals() {
         const icon = muteToggleButton.querySelector('i');
         if (isMuted) {
             icon.classList.remove('fa-volume-high');
             icon.classList.add('fa-volume-xmark');
             muteToggleButton.title = "Activar audio";
             muteToggleButton.setAttribute('aria-label', "Activar audio");
         } else {
             icon.classList.remove('fa-volume-xmark');
             icon.classList.add('fa-volume-high');
             muteToggleButton.title = "Silenciar audio";
             muteToggleButton.setAttribute('aria-label', "Silenciar audio");
         }
         console.log("CHAT_TTS_LOG: Estado visual del botón mute actualizado. Muted:", isMuted); // <-- LOG ACTUALIZACIÓN VISUAL MUTE
    }

    muteToggleButton.addEventListener('click', () => {
        isMuted = !isMuted;
        console.log("CHAT_TTS_LOG: Botón mute clickeado. Nuevo estado Muted:", isMuted); // <-- LOG CLICK MUTE
        updateMuteButtonVisuals();
        if (isMuted) {
             console.log("CHAT_TTS_LOG: Llamando a stopCurrentAudio() desde el handler del botón mute (al silenciar)."); // <-- LOG STOP POR MUTE
            stopCurrentAudio();
        }
        // localStorage.setItem('ttsMuted', isMuted); // Descomentar si se usa localStorage
    });

    // --- Inicialización ---
    // const savedMuteState = localStorage.getItem('ttsMuted');
    // if (savedMuteState !== null) {
    //     isMuted = savedMuteState === 'true';
    //     console.log("CHAT_TTS_LOG: Estado mute cargado desde localStorage:", isMuted);
    // }
    updateMuteButtonVisuals(); // Poner el icono correcto al inicio

    if (messageInput) messageInput.focus();
    scrollToBottom();

    console.log("CHAT_TTS_LOG: Script de integración del Chat con TTS inicializado correctamente y listeners adjuntos."); // <-- LOG FINAL INICIALIZACIÓN

    // Opcional: Re-enfocar input cuando la pestaña del chat se activa
    const chatTab = document.querySelector('.panel-nav-tab[data-target="panel-section-chat"]');
    if(chatTab && messageInput) {
        chatTab.addEventListener('click', () => {
            setTimeout(() => messageInput.focus(), 100);
        });
    }

}); // Fin del DOMContentLoaded