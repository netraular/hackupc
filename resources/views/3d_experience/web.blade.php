<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <title>MODEL 3D - Experiencia Completa</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />

    {{-- CSS Principal --}}
    <link type="text/css" rel="stylesheet" href="{{ asset('3dmodel/css/main.css') }}" />
    {{-- Font Awesome (Opcional) --}}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    {{-- Vite CSS --}}
    @vite([
        'resources/css/3d_experience/fab-styles.css'
        // 'resources/css/app.css',
        // 'resources/js/app.js',
    ])
</head>

<body>
    {{-- Botón "Sobre Nosotros" --}}
    <button id="about-us-button">Sobre Nosotros</button>

    {{-- ========================================= --}}
    {{-- =    CONTROLES INFERIORES ELIMINADOS    = --}}
    {{-- ========================================= --}}
    {{-- <div class="controls-container">
        <div id="animation-buttons">
             <button id="insideCameraBtn">Vista Interior</button>
            <button class="animation" data-animation="0" disabled>Anim 1</button>
            ...etc...
        </div>
    </div> --}}
    {{-- ========================================= --}}
    {{-- =  FIN CONTROLES INFERIORES ELIMINADOS  = --}}
    {{-- ========================================= --}}


    {{-- ========================================= --}}
    {{-- =        FLOATING ACTION BUTTON (FAB)   = --}}
    {{-- ========================================= --}}
    <button id="fab-toggle-button" class="fab" aria-label="Abrir panel de acciones">
        <i class="fas fa-plus"></i>
    </button>

    <div id="fab-action-panel" class="fab-panel">
        <div class="panel-navigation">
            <button class="panel-nav-tab" data-target="panel-section-test">Controles</button> {{-- Cambiado texto --}}
            <button class="panel-nav-tab" data-target="panel-section-chat">Chat</button>
        </div>
        <div class="panel-content-area">
            {{-- Sección de Controles (Antes Test) --}}
            <div id="panel-section-test" class="panel-section">
                <h4>Controles</h4>
                <p>Controla las animaciones y la vista:</p>
                {{-- Botones de Animación FAB (JS los habilitará/deshabilitará) --}}
                {{-- Asegúrate que data-panel-animation coincide con los índices de tus animaciones --}}
                <button class="panel-button" data-panel-animation="0" disabled>Animación 1</button>
                <button class="panel-button" data-panel-animation="1" disabled>Animación 2</button>
                <button class="panel-button" data-panel-animation="2" disabled>Animación 3</button>
                <button class="panel-button" data-panel-animation="3" disabled>Animación 4</button>
                <button class="panel-button" data-panel-animation="4" disabled>Animación 5</button>
                <hr style="margin: 15px 0; border-color: #eee;">
                {{-- Botón de Vista Interior FAB --}}
                <button class="panel-button" data-panel-action="insideView">Vista Interior</button>
            </div>
            {{-- Sección de Chat --}}
            <div id="panel-section-chat" class="panel-section">
                <h4>Chat</h4>
                <p>Aquí irá la interfaz del chat.</p>
                <div style="height: 150px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #888;">
                    (Interfaz de Chat Próximamente)
                </div>
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

    {{-- Configuración JS (sin cambios) --}}
    <script>
      window.ExperienceConfig = {
        modelUrl: "{{ asset('3dmodel/oficial.glb') }}",
        panelImageUrl: "{{ asset('3dmodel/imgs/carrito.jpg') }}"
      };
    </script>

    {{-- Script Principal (Módulo ES6 - sin cambios necesarios aquí) --}}
    <script type="module">
        import { initThree, startAnimationLoop } from '{{ asset("js/3d_experience/threeSetup.js") }}';
        import { initCarExperience, updateCarExperience } from '{{ asset("js/3d_experience/carExperience.js") }}';

        const config = window.ExperienceConfig;
        let threeElements;

        function displayError(message) {
            console.error("Error:", message);
            const errorDivId = 'initialization-error';
            let errorDiv = document.getElementById(errorDivId);
            if (!errorDiv) {
                errorDiv = document.createElement('div'); errorDiv.id = errorDivId;
                Object.assign(errorDiv.style, { position: 'fixed', top: '0', left: '0', width: '100%', padding: '10px', backgroundColor: 'red', color: 'white', textAlign: 'center', zIndex: '2000'});
                document.body.appendChild(errorDiv);
            }
            errorDiv.textContent = `Error: ${message} Por favor, revisa la consola.`;
            errorDiv.style.display = 'block';
        }

        document.addEventListener('DOMContentLoaded', async () => {
            console.log("DOM cargado. Iniciando scripts principales...");
            try {
                console.log("Inicializando Three.js...");
                threeElements = initThree(document.body);
                if (!threeElements || !threeElements.scene || !threeElements.camera || !threeElements.controls) throw new Error("Init Three.js falló.");
                console.log("Three.js inicializado.");

                console.log("Iniciando experiencia del coche...");
                // initCarExperience ahora configurará listeners SOLO para los botones del FAB
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

    {{-- Scripts Adicionales (sin cambios) --}}
    <script src="{{ asset('js/3d_experience/about-popup.js') }}"></script>
    <script src="{{ asset('js/3d_experience/fabController.js') }}"></script>

</body>
</html>