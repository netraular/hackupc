// public/js/3d_experience/chatIntegration.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Verificación de que estamos en la página correcta ---
    const chatSection = document.getElementById('panel-section-chat');
    if (!chatSection) {
        return; // Silencioso si no está la sección
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
    console.log("CHAT_TTS_LOG: Configuración cargada:", { chatSendUrl, ttsSynthesizeUrl, csrfToken: '******' });

    // --- Estado del Chat y TTS ---
    let isMuted = false;
    let currentAudio = null;

    // --- Funciones del Chat (sin cambios) ---
    function addMessage(text, sender = 'user') {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container', sender === 'user' ? 'user-message-container' : 'ai-message-container');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageDiv.textContent = text; // Usar textContent es más seguro que innerHTML
        messageContainer.appendChild(messageDiv);
        chatbox.appendChild(messageContainer);
        scrollToBottom();
    }
    function scrollToBottom() {
        // Da un pequeño respiro para que el DOM se actualice antes de hacer scroll
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
                // Contenido simple para el indicador
                indicatorBubble.innerHTML = '<span>.</span><span>.</span><span>.</span>'; // CSS se encargará de animar
                indicator.appendChild(indicatorBubble);
                chatbox.appendChild(indicator);
                scrollToBottom();
            }
        } else {
            if (indicator) indicator.remove();
        }
    }
     function setControlsEnabled(enabled) {
        if(messageInput) messageInput.disabled = !enabled;
        if(messageInput) messageInput.style.opacity = enabled ? 1 : 0.6;
        if(sendButton) sendButton.disabled = !enabled;
        if(sendButton) sendButton.style.opacity = enabled ? 1 : 0.6;
        if (!enabled && messageInput) messageInput.blur(); // Quitar foco si se deshabilita
    }

    // --- Función para obtener y reproducir TTS ---
    async function fetchAndPlayTTS(text) {
        console.log("CHAT_TTS_LOG: Entrando en fetchAndPlayTTS.");

        if (isMuted) {
            console.log("CHAT_TTS_LOG: TTS está muteado. Saltando reproducción.");
            return;
        }
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
             console.log("CHAT_TTS_LOG: No hay texto válido para TTS. Texto recibido:", text);
             return;
        }

        console.log("CHAT_TTS_LOG: Deteniendo audio previo (si existe).");
        stopCurrentAudio(); // Detiene y limpia el audio anterior

        const textExcerpt = text.substring(0, 80) + (text.length > 80 ? "..." : "");
        console.log(`CHAT_TTS_LOG: Solicitando TTS para: "${textExcerpt}"`);

        try {
            console.log(`CHAT_TTS_LOG: Haciendo fetch a TTS API: ${ttsSynthesizeUrl}`);
            const response = await fetch(ttsSynthesizeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json', // Esperamos JSON con base64
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ text: text })
            });

            console.log(`CHAT_TTS_LOG: Respuesta recibida de TTS API. Status: ${response.status}`);

            if (!response.ok) {
                 let errorDetails = `Error ${response.status}`;
                 try {
                     const errorData = await response.json();
                     errorDetails += `: ${errorData.message || JSON.stringify(errorData)}`;
                     console.error(`CHAT_TTS_LOG: Error en TTS API. Respuesta JSON:`, errorData);
                 } catch (e) {
                     const errorText = await response.text();
                     errorDetails += `: ${errorText || 'No details'}`;
                     console.error(`CHAT_TTS_LOG: Error en TTS API. No se pudo parsear JSON. Respuesta Texto:`, errorText);
                 }
                // No mostramos error en el chat, solo log
                return;
            }

            const result = await response.json();
            console.log("CHAT_TTS_LOG: Respuesta TTS parseada correctamente.");

            if (result.audio_base64) {
                console.log(`CHAT_TTS_LOG: audio_base64 recibido (longitud: ${result.audio_base64.length}). MimeType: ${result.mime_type}`);
                const audioDataUrl = `data:${result.mime_type || 'audio/mpeg'};base64,${result.audio_base64}`;

                // Crear un nuevo objeto Audio
                const audioPlayer = new Audio(audioDataUrl);
                currentAudio = audioPlayer; // Guardar referencia globalmente
                console.log("CHAT_TTS_LOG: Objeto Audio creado.");

                // Setup listeners para el nuevo audioPlayer
                audioPlayer.addEventListener('canplaythrough', () => {
                    console.log("CHAT_TTS_LOG: Evento 'canplaythrough'. Listo para reproducir.");
                }, { once: true }); // Escuchar solo una vez

                audioPlayer.addEventListener('ended', () => {
                    console.log("CHAT_TTS_LOG: Evento 'ended'. Reproducción TTS finalizada.");
                    if (currentAudio === audioPlayer) { // Solo limpiar si es el audio actual
                        currentAudio = null;
                    }
                }, { once: true });

                audioPlayer.addEventListener('error', (e) => {
                    console.error("CHAT_TTS_LOG: Evento 'error' en el objeto Audio:", e);
                    if (currentAudio === audioPlayer) {
                        currentAudio = null;
                    }
                }, { once: true });

                audioPlayer.addEventListener('pause', () => {
                    console.log("CHAT_TTS_LOG: Evento 'pause' en el objeto Audio.");
                });
                 audioPlayer.addEventListener('stalled', () => {
                    console.warn("CHAT_TTS_LOG: Evento 'stalled'. Problema cargando datos?");
                });

                // Intenta reproducir
                try {
                     console.log("CHAT_TTS_LOG: Llamando a audioPlayer.play()...");
                     await audioPlayer.play();
                     console.log("CHAT_TTS_LOG: Reproducción iniciada (promesa resuelta).");
                } catch (playError) {
                    console.error("CHAT_TTS_LOG: Error al llamar a play():", playError);
                    if (currentAudio === audioPlayer) { // Limpiar si falló la reproducción
                         currentAudio = null;
                    }
                    // Considerar mostrar un mensaje al usuario o un botón de reintentar si esto ocurre a menudo
                }

            } else {
                console.error("CHAT_TTS_LOG: Respuesta TTS OK pero sin 'audio_base64'. Resultado:", result);
            }

        } catch (error) {
            console.error('CHAT_TTS_LOG: Error en el bloque try/catch de fetchAndPlayTTS:', error);
             if (currentAudio) { // Asegurarse de limpiar si hubo un error durante el fetch
                stopCurrentAudio();
            }
        }
    }

    // --- Función para detener el audio actual ---
    function stopCurrentAudio() {
        if (currentAudio) {
            console.log("CHAT_TTS_LOG: stopCurrentAudio() - Deteniendo y limpiando audio actual.");
            currentAudio.pause();
            currentAudio.removeAttribute('src'); // Forma más segura de limpiar
            currentAudio.load(); // Detiene la descarga
            // Quitar listeners explícitamente ya no es estrictamente necesario si la referencia se pierde,
            // pero no hace daño ser explícito si se reutilizara el objeto (aquí no lo hacemos).
            currentAudio = null; // Eliminar la referencia global
        } else {
            // console.log("CHAT_TTS_LOG: stopCurrentAudio() - No hay audio actual para detener.");
        }
    }

    // --- Manejo de Envío de Mensaje ---
    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (messageInput.disabled) return;
        const messageText = messageInput.value.trim();
        if (!messageText) return;

        console.log("CHAT_TTS_LOG: Formulario enviado. Mensaje:", messageText);
        setControlsEnabled(false);
        addMessage(messageText, 'user');
        messageInput.value = '';
        showTypingIndicator(true);
        console.log("CHAT_TTS_LOG: Llamando a stopCurrentAudio() desde submit handler.");
        stopCurrentAudio(); // Detener TTS si estaba hablando antes de enviar nuevo mensaje

        const dataToSend = JSON.stringify({ message: messageText });
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        };

        console.log("CHAT_TTS_LOG: Llamando a sendData().");
        await sendData(dataToSend, headers);
    });

    // --- Función genérica para enviar datos y manejar respuesta ---
    async function sendData(jsonData, headers) {
        console.log("CHAT_TTS_LOG: Entrando en sendData().");
        try {
            console.log(`CHAT_TTS_LOG: Haciendo fetch a Chat API: ${chatSendUrl}`);
            const response = await fetch(chatSendUrl, {
                method: 'POST',
                headers: headers,
                body: jsonData
            });
            console.log(`CHAT_TTS_LOG: Respuesta recibida de Chat API. Status: ${response.status}`);

            showTypingIndicator(false);

            let responseData = {};
            try {
                responseData = await response.json();
                 console.log("CHAT_TTS_LOG: Respuesta Chat API parseada:", responseData);
            } catch (e) {
                console.error("CHAT_TTS_LOG: Error parseando JSON de Chat API:", e);
                const responseText = await response.text();
                console.error("CHAT_TTS_LOG: Respuesta Texto Chat API:", responseText);
                // Prepara un objeto de error simulando la estructura esperada
                responseData = { error: `Error ${response.status}: Invalid JSON response.`, reply: `Sorry, I received an invalid response (Status ${response.status}). Please check server logs.` };
            }

            // ----- PROCESAMIENTO DE RESPUESTA EXITOSA O CON ERROR CONTROLADO -----
            if (response.ok && responseData.message) {
                // *** CASO ÉXITO ***
                const aiMessageText = responseData.message;
                const aiAnimationsData = responseData.animations; // Esperamos string JSON: "[1,3]" o "[]" o null
                const aiPhotoData = responseData.photo; // Obtener la clave 'photo'

                console.log("CHAT_TTS_LOG: Respuesta AI (mensaje) recibida:", aiMessageText);
                console.log("CHAT_TTS_LOG: Respuesta AI (animaciones string):", aiAnimationsData);
                console.log("CHAT_TTS_LOG: Respuesta AI (photo string):", aiPhotoData); // <--- AÑADIDO: Log para 'photo'



                addMessage(aiMessageText, 'ai');

                // --- Procesar animaciones (SI EXISTEN) ---
                if (aiAnimationsData && typeof aiAnimationsData === 'string') {
                    console.log("CHAT_TTS_LOG: [ANIMATIONS] Procesando cadena de animación:", aiAnimationsData);
                    try {
                        const animationsArray = JSON.parse(aiAnimationsData);
                        console.log("CHAT_TTS_LOG: [ANIMATIONS] Cadena parseada a array:", animationsArray);

                        if (Array.isArray(animationsArray) && animationsArray.length > 0) {
                            const firstAnimationIndex = animationsArray[0]; // Tomar el primer índice

                            // Validar que sea un número
                            if (typeof firstAnimationIndex === 'number' && Number.isInteger(firstAnimationIndex) && firstAnimationIndex >= 0) { // Mejor validación
                                console.log(`%cCHAT_TTS_LOG: [ANIMATIONS] Índice de animación válido encontrado: ${firstAnimationIndex}`, 'color: orange; font-weight: bold;');

                                // Verificar que la función global exista ANTES de llamarla
                                if (typeof window.triggerCarAnimation === 'function') {
                                    console.log(`CHAT_TTS_LOG: [ANIMATIONS] Llamando a window.triggerCarAnimation(${firstAnimationIndex})...`);
                                    window.triggerCarAnimation(firstAnimationIndex); // ¡Llamada a la función de carExperience.js!
                                    console.log(`CHAT_TTS_LOG: [ANIMATIONS] Llamada a window.triggerCarAnimation(${firstAnimationIndex}) realizada.`);
                                } else {
                                    console.warn("CHAT_TTS_LOG: [ANIMATIONS] La función window.triggerCarAnimation NO está disponible. Asegúrate de que carExperience.js se cargó y expuso la función correctamente.");
                                    addMessage("[Error interno: No se pudo ejecutar la animación]", 'ai'); // Informar discretamente
                                }
                            } else {
                                console.warn("CHAT_TTS_LOG: [ANIMATIONS] El primer elemento del array ('"+ firstAnimationIndex +"') no es un índice de animación válido (número entero no negativo).");
                            }
                        } else {
                           console.log("CHAT_TTS_LOG: [ANIMATIONS] El array de animaciones parseado está vacío o no es un array.");
                        }
                    } catch (parseError) {
                        console.error("CHAT_TTS_LOG: [ANIMATIONS] Error al parsear la cadena JSON de animaciones:", parseError, ". Cadena recibida:", aiAnimationsData);
                        // No hacer nada más si el parseo falla, solo log
                    }
                } else {
                    console.log("CHAT_TTS_LOG: [ANIMATIONS] No se recibió una cadena de animaciones válida.");
                }
                // --- FIN PROCESAR ANIMACIONES ---

                // --- LLAMAR A TTS ---
                console.log("CHAT_TTS_LOG: Llamando a fetchAndPlayTTS() con la respuesta AI.");
                await fetchAndPlayTTS(aiMessageText);
                // ---------------------

            } else {
                // *** CASO ERROR (Controlado por backend o fallo de red/parseo) ***
                // Si response.ok es true pero falta 'message', es un error de formato inesperado del backend.
                // Si response.ok es false, usamos el 'reply' o 'error' que el backend DEBERÍA haber incluido.
                const errorMessage = responseData?.reply || responseData?.error || `Error ${response.status}: Unexpected response from server.`;
                console.error("CHAT_TTS_LOG: Error en la respuesta de Chat API o formato inesperado:", errorMessage, "Data:", responseData);
                addMessage(`${errorMessage}`, 'ai'); // Mostrar el error/reply del backend al usuario
                console.log("CHAT_TTS_LOG: Llamando a stopCurrentAudio() debido a error en Chat API.");
                stopCurrentAudio(); // Asegurar que no haya TTS sonando si hubo error
            }
            // ----- FIN PROCESAMIENTO -----

        } catch (networkError) {
            // *** CASO ERROR DE RED (Fetch falló completamente) ***
            showTypingIndicator(false);
            console.error('CHAT_TTS_LOG: Error de red en sendData (Fetch Error):', networkError);
            addMessage('Error de conexión. Por favor, revisa tu conexión e inténtalo de nuevo.', 'ai');
            console.log("CHAT_TTS_LOG: Llamando a stopCurrentAudio() debido a error de conexión.");
            stopCurrentAudio();
        } finally {
            // Se ejecuta siempre, tanto en éxito como en error
            console.log("CHAT_TTS_LOG: Bloque finally de sendData. Habilitando controles.");
            setControlsEnabled(true);
            // Re-enfocar solo si los controles están habilitados y el input existe
            if (messageInput && !messageInput.disabled) {
                messageInput.focus();
            }
        }
    }

    // --- Manejo del Botón de Silencio/Activación ---
    function updateMuteButtonVisuals() {
         const icon = muteToggleButton.querySelector('i');
         if (!icon) return; // Seguridad
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
         // console.log("CHAT_TTS_LOG: Estado visual del botón mute actualizado. Muted:", isMuted); // Log opcional
    }

    muteToggleButton.addEventListener('click', () => {
        isMuted = !isMuted;
        console.log("CHAT_TTS_LOG: Botón mute clickeado. Nuevo estado Muted:", isMuted);
        updateMuteButtonVisuals();
        if (isMuted) {
             console.log("CHAT_TTS_LOG: Llamando a stopCurrentAudio() desde el handler del botón mute (al silenciar).");
            stopCurrentAudio(); // Detener audio si se silencia
        }
        // Persistencia opcional:
        // try { localStorage.setItem('ttsMuted', isMuted); } catch (e) { console.warn("No se pudo guardar estado mute en localStorage"); }
    });

    // --- Inicialización ---
    // Cargar estado mute persistido (opcional)
    // try {
    //     const savedMuteState = localStorage.getItem('ttsMuted');
    //     if (savedMuteState !== null) {
    //         isMuted = savedMuteState === 'true';
    //         console.log("CHAT_TTS_LOG: Estado mute cargado desde localStorage:", isMuted);
    //     }
    // } catch (e) { console.warn("No se pudo leer estado mute de localStorage"); }

    updateMuteButtonVisuals(); // Poner el icono correcto al inicio

    if (messageInput) messageInput.focus(); // Foco inicial
    scrollToBottom(); // Asegurar que el mensaje inicial sea visible

    console.log("CHAT_TTS_LOG: Script de integración del Chat con TTS inicializado correctamente y listeners adjuntos.");

    // Opcional: Re-enfocar input cuando la pestaña del chat se activa (si está en un panel con pestañas)
    const chatTab = document.querySelector('.panel-nav-tab[data-target="panel-section-chat"]');
    if(chatTab && messageInput) {
        chatTab.addEventListener('click', () => {
            // Pequeño delay para asegurar que el panel sea visible antes de enfocar
            setTimeout(() => { if (!messageInput.disabled) messageInput.focus(); }, 100);
        });
    }

}); // Fin del DOMContentLoaded