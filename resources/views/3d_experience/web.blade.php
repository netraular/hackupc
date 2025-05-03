<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <title>MODEL 3D - Experiencia Completa</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />

    {{-- Carga del CSS principal --}}
    {{-- Si este archivo NO es procesado por Vite y está en /public --}}
    <link type="text/css" rel="stylesheet" href="{{ asset('3dmodel/css/main.css') }}" />
    {{-- Si main.css SÍ es procesado por Vite, muévelo a resources/css y añádelo a la directiva @vite --}}

    {{-- Opcional: Font Awesome para iconos del FAB --}}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossorigin="anonymous" referrerpolicy="no-referrer" />

    {{-- Directiva @vite para cargar los assets procesados por Vite --}}
    {{-- Incluye aquí todos los puntos de entrada CSS y JS que Vite debe manejar para esta página --}}
    {{-- Mínimo, necesitas incluir el CSS que moviste --}}
    @vite([
        'resources/css/3d_experience/fab-styles.css'
        // Si tienes un app.css o app.js global gestionado por Vite, añádelo también:
        // 'resources/css/app.css',
        // 'resources/js/app.js',
    ])


</head>

<body>
    {{-- Botón "Sobre Nosotros" (controlado por about-popup.js) --}}
    <button id="about-us-button">Sobre Nosotros</button>

    {{-- Contenedor para los controles inferiores (animaciones, vista interior) --}}
    <div class="controls-container">
        <div id="animation-buttons">
            <button class="animation" data-animation="0" disabled>Anim 1</button>
            <button class="animation" data-animation="1" disabled>Anim 2</button>
            <button class="animation" data-animation="2" disabled>Anim 3</button>
            <button class="animation" data-animation="3" disabled>Anim 4</button>
            <button class="animation" data-animation="4" disabled>Anim 5</button>
        </div>
        <div id="info">
            <button id="insideCameraBtn">Vista Interior</button>
        </div>
    </div>

    {{-- ========================================= --}}
    {{-- =        FLOATING ACTION BUTTON (FAB)   = --}}
    {{-- ========================================= --}}
    <button id="fab-toggle-button" class="fab" aria-label="Abrir panel de acciones">
        <i class="fas fa-plus"></i> {{-- Icono Font Awesome --}}
    </button>

    <div id="fab-action-panel" class="fab-panel">
        <div class="panel-navigation">
            {{-- data-target debe coincidir con el ID de la sección --}}
            <button class="panel-nav-tab" data-target="panel-section-test">Test</button>
            <button class="panel-nav-tab" data-target="panel-section-chat">Chat</button>
        </div>
        <div class="panel-content-area">
        {{-- Sección de Test --}}
            <div id="panel-section-test" class="panel-section">
                <h4>Área de Pruebas</h4>
                <p>Controla las animaciones y la vista:</p>

                {{-- Botones de Animación (usando data-panel-animation) --}}
                <button class="panel-button" data-panel-animation="0">Animación 1</button>
                <button class="panel-button" data-panel-animation="1">Animación 2</button>
                <button class="panel-button" data-panel-animation="2">Animación 3</button>
                <button class="panel-button" data-panel-animation="3">Animación 4</button>
                <button class="panel-button" data-panel-animation="4">Animación 5</button>

                {{-- Separador visual (opcional) --}}
                <hr style="margin: 15px 0; border-color: #eee;">

                {{-- Botón de Vista Interior (usando data-panel-action) --}}
                <button class="panel-button" data-panel-action="insideView">Vista Interior</button>

                {{-- Puedes añadir aquí los botones de prueba STT/TTS si los necesitas --}}
                {{-- <hr style="margin: 15px 0; border-color: #eee;">
                <button class="panel-button" onclick="alert('Probando STT...')">Probar STT</button>
                <button class="panel-button" onclick="alert('Probando TTS...')">Probar TTS</button> --}}
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


    {{-- Importmap para Three.js (cargado desde CDN, no necesita Vite) --}}
    <script type="importmap">
        {
            "imports": {
              "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
              "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
        }
    </script>

    {{-- Configuración JS (pasa rutas de assets NO procesados por Vite) --}}
    <script>
      window.ExperienceConfig = {
        // asset() es correcto aquí porque son archivos en /public que Vite no compila
        modelUrl: "{{ asset('3dmodel/oficial.glb') }}",
        panelImageUrl: "{{ asset('3dmodel/imgs/carrito.jpg') }}"
      };
    </script>

    {{-- Script Principal (Orquestador - Módulo ES6) --}}
    {{-- Carga módulos JS que están en /public y NO son procesados por Vite --}}
    {{-- Si threeSetup.js y carExperience.js estuvieran en resources/js y en @vite, este script cambiaría --}}
    <script type="module">
        import { initThree, startAnimationLoop } from '{{ asset("js/3d_experience/threeSetup.js") }}';
        import { initCarExperience, updateCarExperience } from '{{ asset("js/3d_experience/carExperience.js") }}';

        const config = window.ExperienceConfig;
        let threeElements;

        try {
            threeElements = initThree(document.body);
            if (!threeElements) throw new Error("Three.js init failed");

            initCarExperience(threeElements, config.modelUrl, config.panelImageUrl)
                .then(() => {
                    startAnimationLoop(updateCarExperience);
                    console.log("Experiencia 3D y bucle iniciados.");
                })
                .catch(carInitError => {
                    console.error("Error iniciando experiencia del coche:", carInitError);
                    displayError("Fallo al cargar experiencia del coche.");
                });

        } catch (threeInitError) {
            console.error("Error iniciando Three.js:", threeInitError);
            displayError("Fallo al iniciar entorno 3D.");
        }

        // Función para mostrar errores
        function displayError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.textContent = `Error: ${message} Por favor, revisa la consola para más detalles.`;
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '0';
            errorDiv.style.left = '0';
            errorDiv.style.width = '100%';
            errorDiv.style.padding = '10px';
            errorDiv.style.backgroundColor = 'red';
            errorDiv.style.color = 'white';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.zIndex = '2000';
            document.body.appendChild(errorDiv);
        }
    </script>

    {{-- Scripts adicionales NO módulos (cargados desde /public) --}}
    {{-- Si estos JS estuvieran en resources/js y en @vite, se quitarían de aquí --}}
    <script src="{{ asset('js/3d_experience/about-popup.js') }}"></script>
    <script src="{{ asset('js/3d_experience/fabController.js') }}"></script>

</body>
</html>