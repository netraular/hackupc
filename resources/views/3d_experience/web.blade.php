<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <title>MODEL 3D - Experiencia Completa</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    {{-- CSRF Token --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- CSS Principal --}}
    <link type="text/css" rel="stylesheet" href="{{ asset('3dmodel/css/main.css') }}" />
    {{-- Font Awesome --}}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    {{-- Vite CSS --}}
    @vite([
        'resources/css/3d_experience/fab-styles.css',
        'resources/css/3d_experience/chat-styles.css' // <--- AÑADIDO CSS DEL CHAT
        // 'resources/css/app.css',
        // 'resources/js/app.js',
    ])
</head>

<body>
    {{-- Botón "Sobre Nosotros" --}}
    <button id="about-us-button">Sobre Nosotros</button>

    {{-- ========================================= --}}
    {{-- =        FLOATING ACTION BUTTON (FAB)   = --}}
    {{-- ========================================= --}}
    <button id="fab-toggle-button" class="fab" aria-label="Abrir panel de acciones">
        <i class="fas fa-plus"></i>
    </button>

    <div id="fab-action-panel" class="fab-panel">
        <div class="panel-navigation">
            <button class="panel-nav-tab" data-target="panel-section-test">Controles</button>
            <button class="panel-nav-tab" data-target="panel-section-chat">Chat</button>
        </div>
        <div class="panel-content-area">
            {{-- Sección de Controles (Sin cambios) --}}
            <div id="panel-section-test" class="panel-section">
                <h4>Controles</h4>
                <p>Controla las animaciones y la vista:</p>
                <button class="panel-button" data-panel-animation="0" disabled>Animación 1</button>
                <button class="panel-button" data-panel-animation="1" disabled>Animación 2</button>
                <button class="panel-button" data-panel-animation="2" disabled>Animación 3</button>
                <button class="panel-button" data-panel-animation="3" disabled>Animación 4</button>
                <button class="panel-button" data-panel-animation="4" disabled>Animación 5</button>
                <button class="panel-button" data-panel-animation="5" disabled>Animación 6</button>
                <button class="panel-button" data-panel-animation="6" disabled>Animación 7</button>
                <button class="panel-button" data-panel-animation="7" disabled>Animación 8</button>
                <button class="panel-button" data-panel-animation="8" disabled>Animación 9</button>
                <hr style="margin: 15px 0; border-color: #eee;">
                <button class="panel-button" data-panel-action="panelInsideBtn ">Vista Interior</button>
            </div>

            {{-- Sección de Chat --}}
            <div id="panel-section-chat" class="panel-section">
                <h4>Chat IA</h4> {{-- Título actualizado --}}

                {{-- ========== HTML DEL CHAT PEGADO AQUÍ ========== --}}
                <div id="chatbox">
                    {{-- Mensaje inicial del AI --}}
                    <div class="ai-message-container message-container">
                        <div class="message ai-message">
                            Hi! I'm your CUPRA assistant. What do you want to know about the car?
                        </div>
                    </div>
                    {{-- Los nuevos mensajes se añadirán aquí por JS --}}
                </div>

                <form id="chat-form">
                    <input type="text" id="message-input" placeholder="Escribe tu mensaje..." autocomplete="off">
                    <div id="controls-container">
                        <button type="submit" id="send-button" class="chat-button" title="Enviar Mensaje">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </form>
                {{-- ========== FIN HTML DEL CHAT ========== --}}

            </div>
        </div>
    </div>
    {{-- ========================================= --}}
    {{-- =      FIN FLOATING ACTION BUTTON       = --}}
    {{-- ========================================= --}}


    {{-- Importmap (sin cambios) --}}
    <script type="importmap">
        {
            "imports": {
              "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
              "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
        }
    </script>

    {{-- Configuración JS --}}
    <script>
      window.ExperienceConfig = {
        modelUrl: "{{ asset('3dmodel/oficial_3.glb') }}",
        panelImageUrl: "{{ asset('3dmodel/imgs/carrito.jpg') }}",
        // --- AÑADIDO: URL para el chat ---
        chatSendUrl: "{{ route('chat.send') }}", // Usa la función route() de Blade
        csrfToken: "{{ csrf_token() }}"      // Pasar también el token aquí es útil
      };
    </script>

    {{-- Script Principal (Módulo ES6 - sin cambios) --}}
    <script type="module">
        import { initThree, startAnimationLoop } from '{{ asset("js/3d_experience/threeSetup.js") }}';
        import { initCarExperience, updateCarExperience } from '{{ asset("js/3d_experience/carExperience.js") }}';

        const config = window.ExperienceConfig;
        let threeElements;

        function displayError(message) { /* ... (sin cambios) ... */ }

        document.addEventListener('DOMContentLoaded', async () => {
            console.log("DOM cargado. Iniciando scripts principales...");
            try {
                // ... (inicialización Three.js y CarExperience sin cambios) ...
                console.log("Inicializando Three.js...");
                threeElements = initThree(document.body);
                if (!threeElements || !threeElements.scene || !threeElements.camera || !threeElements.controls) throw new Error("Init Three.js falló.");
                console.log("Three.js inicializado.");

                console.log("Iniciando experiencia del coche...");
                await initCarExperience(threeElements, config.modelUrl, config.panelImageUrl);
                console.log("Experiencia del coche inicializada.");

                console.log("Iniciando bucle de animación...");
                startAnimationLoop(updateCarExperience);
                console.log("Experiencia 3D y bucle iniciados.");

                const errorDiv = document.getElementById('initialization-error');
                if (errorDiv) errorDiv.style.display = 'none';

            } catch (error) {
                console.error("Error CRÍTICO en inicialización:", error);
                displayError(error.message || "Fallo durante la inicialización.");
            }
        });
    </script>

    {{-- Scripts Adicionales --}}
    <script src="{{ asset('js/3d_experience/about-popup.js') }}"></script>
    <script src="{{ asset('js/3d_experience/fabController.js') }}"></script>
    <script src="{{ asset('js/3d_experience/chatIntegration.js') }}"></script>

</body>
</html>