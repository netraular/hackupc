import * as THREE from 'three';
//  hello 2
// --- INICIO: Código de ARButton.js (pegado directamente aquí) ---
// (Código fuente obtenido de https://github.com/mrdoob/three.js/blob/dev/examples/jsm/webxr/ARButton.js)
// Ligeramente adaptado para encajar como clase dentro del módulo
class ARButton {
    static createButton( renderer, sessionInit = {} ) {
        const button = document.createElement( 'button' );

        function showStartAR( /*device*/ ) {
            if ( sessionInit.domOverlay === undefined ) {
                const overlay = document.createElement( 'div' );
                overlay.style.display = 'none';
                document.body.appendChild( overlay );

                const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
                svg.setAttribute( 'width', 38 );
                svg.setAttribute( 'height', 38 );
                svg.style.position = 'absolute';
                svg.style.right = '20px';
                svg.style.top = '20px';
                svg.addEventListener( 'click', function () {
                    currentSession.end();
                } );
                overlay.appendChild( svg );

                const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
                path.setAttribute( 'd', 'M 12,12 L 28,28 M 28,12 12,28' );
                path.setAttribute( 'stroke', '#fff' );
                path.setAttribute( 'stroke-width', 2 );
                svg.appendChild( path );

                if ( sessionInit.optionalFeatures === undefined ) {
                     sessionInit.optionalFeatures = [];
                }
                sessionInit.optionalFeatures.push( 'dom-overlay' );
                sessionInit.domOverlay = { root: overlay };
            }

            //

            let currentSession = null;

            async function onSessionStarted( session ) {
                session.addEventListener( 'end', onSessionEnded );
                renderer.xr.setReferenceSpaceType( 'local' );
                await renderer.xr.setSession( session );
                button.textContent = 'STOP AR';
                if (sessionInit.domOverlay) sessionInit.domOverlay.root.style.display = '';

                currentSession = session;
                 // Disparar evento personalizado o llamar a una función cuando la sesión empieza
                 button.dispatchEvent(new CustomEvent('sessionstart'));
            }

            function onSessionEnded( /*event*/ ) {
                currentSession.removeEventListener( 'end', onSessionEnded );
                button.textContent = 'START AR';
                if (sessionInit.domOverlay) sessionInit.domOverlay.root.style.display = 'none';

                currentSession = null;
                 // Disparar evento personalizado o llamar a una función cuando la sesión termina
                 button.dispatchEvent(new CustomEvent('sessionend'));
            }

            //

            button.style.display = '';
            button.style.cursor = 'pointer';
            // button.style.left = 'calc(50% - 50px)'; // El CSS externo ya lo centra
            // button.style.width = '100px'; // CSS externo controla tamaño si es necesario

            button.textContent = 'START AR';

            button.onmouseenter = function () {
                // button.style.opacity = '1.0'; // Controlado por :hover CSS
            };

            button.onmouseleave = function () {
               // button.style.opacity = '0.5'; // Controlado por :hover CSS
            };

            button.onclick = function () {
                if ( currentSession === null ) {
                    navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );
                } else {
                    currentSession.end();
                }
            };
        }

        function disableButton() {
            button.style.display = '';
            button.style.cursor = 'auto';
            // button.style.left = 'calc(50% - 75px)'; // CSS externo
            // button.style.width = '150px'; // CSS externo

            button.onmouseenter = null;
            button.onmouseleave = null;

            button.onclick = null;
        }

        function showARNotSupported() {
            disableButton();
            button.textContent = 'AR NOT SUPPORTED 1';
             // Mostrar mensaje de error más claro
             const errorDiv = document.createElement('div');
             errorDiv.className = 'ar-error-message';
             errorDiv.innerHTML = 'Tu navegador o dispositivo no soporta WebXR para Realidad Aumentada.<br/>Prueba con Chrome en un dispositivo Android compatible o un visor WebXR en iOS.';
             document.body.appendChild(errorDiv);
        }

        function showARNotAllowed( exception ) {
            disableButton();
            console.warn( 'Exception when trying to call xr.isSessionSupported', exception );
            button.textContent = 'AR NOT ALLOWED';
             // Mensaje de error si el usuario deniega permisos
             const errorDiv = document.createElement('div');
             errorDiv.className = 'ar-error-message';
             errorDiv.innerHTML = 'Permiso denegado para acceder a la Realidad Aumentada.<br/> Revisa los permisos de cámara y sensores de movimiento en la configuración de tu navegador.';
             document.body.appendChild(errorDiv);
        }

        function stylizeElement( element ) { // Ya no se usa mucho con CSS externo
            // element.style.position = 'absolute';
            // element.style.bottom = '20px';
            // element.style.padding = '12px 6px';
            // element.style.border = '1px solid #fff';
            // element.style.borderRadius = '4px';
            // element.style.background = 'rgba(0,0,0,0.1)';
            // element.style.color = '#fff';
            // element.style.font = 'normal 13px sans-serif';
            // element.style.textAlign = 'center';
            // element.style.opacity = '0.5';
            // element.style.outline = 'none';
            // element.style.zIndex = '999';
        }

        if ( 'xr' in navigator ) {
            button.id = 'ARButton';
            // stylizeElement( button ); // Dejar que CSS externo maneje esto

            navigator.xr.isSessionSupported( 'immersive-ar' ).then( function ( supported ) {
                supported ? showStartAR() : showARNotSupported();
            } ).catch( showARNotAllowed );

            return button;
        } else {
            const message = document.createElement( 'a' );
            if ( window.isSecureContext === false ) {
                message.href = document.location.href.replace( /^http:/, 'https:' );
                message.innerHTML = 'WEBXR NEEDS HTTPS'; // TODO Improve message
            } else {
                message.href = 'https://immersiveweb.dev/';
                message.innerHTML = 'WEBXR NOT AVAILABLE';
            }
            message.style.left = 'calc(50% - 90px)';
            message.style.width = '180px';
            message.style.textDecoration = 'none';
            // stylizeElement( message ); // CSS externo
             message.classList.add('ar-error-message'); // Usar estilo de error

            return message;
        }
    }
}
// --- FIN: Código de ARButton.js ---


// --- INICIO: Lógica de la aplicación AR ---
let camera, scene, renderer;
let controller;
let reticle; // El indicador visual
let hitTestSource = null;
let hitTestSourceRequested = false;
let placedObject = null; // Referencia al cubo

init();
// La animación se inicia/detiene por el botón AR

function init() {
    const container = document.createElement('div'); // Contenedor para el canvas
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0).normalize();
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // Habilitar WebXR
    container.appendChild(renderer.domElement);

    // --- Botón AR ---
    const arButtonContainer = document.getElementById('ar-button-container');
    const infoElement = document.getElementById('info');

    const button = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'] // Esencial para detectar superficies
    });

    // Escuchar eventos personalizados del botón para manejar UI
     button.addEventListener('sessionstart', () => {
         infoElement.style.display = 'block'; // Mostrar instrucciones al entrar en AR
     });
     button.addEventListener('sessionend', () => {
         // Limpiar al salir de AR
         infoElement.style.display = 'none';
         if (placedObject) placedObject.visible = false;
         reticle.visible = false;
         hitTestSourceRequested = false;
         hitTestSource = null;
     });

    arButtonContainer.appendChild(button); // Añadir el botón al contenedor


    // --- Controlador (para input de tap) ---
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect); // 'select' es el tap en AR
    scene.add(controller);

    // --- Retícula (Indicador visual) ---
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.07, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true })
    );
    reticle.matrixAutoUpdate = false; // La posición la controla el hit-test
    reticle.visible = false; // Invisible hasta detectar superficie
    scene.add(reticle);

    // --- Objeto a Colocar (CUBO SIMPLE) ---
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); // Cubo de 10cm
    const material = new THREE.MeshStandardMaterial({
        color: 0x0099ff, // Azulado
        roughness: 0.6,
        metalness: 0.1
     });
    placedObject = new THREE.Mesh(geometry, material);
    placedObject.visible = false; // Inicialmente invisible
    scene.add(placedObject);

    // --- Eventos y Bucle de Renderizado ---
    window.addEventListener('resize', onWindowResize);
    renderer.setAnimationLoop(renderLoop); // Iniciar bucle
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSelect() {
    // Se llama al tocar la pantalla en modo AR
    if (reticle.visible && placedObject) {
        // Colocar el cubo en la posición de la retícula
        placedObject.position.setFromMatrixPosition(reticle.matrix);
        // Opcional: Alinear la rotación (puede no ser necesario para un cubo)
        // placedObject.quaternion.setFromRotationMatrix(reticle.matrix);
        placedObject.visible = true; // Hacer visible el cubo
        document.getElementById('info').style.display = 'none'; // Ocultar instrucciones

        // Opcional: si solo quieres colocar UN objeto
        // reticle.visible = false;
        // controller.removeEventListener('select', onSelect); // Dejar de detectar taps
    }
}

// Bucle de Renderizado (se ejecuta cada frame)
function renderLoop(timestamp, frame) {
    if (renderer.xr.isPresenting) { // Solo procesar AR si está activa la sesión
        if (frame) { // El objeto frame solo existe dentro de una sesión XR
            const referenceSpace = renderer.xr.getReferenceSpace();
            const session = renderer.xr.getSession();

            // Solicitar fuente de hit-test si no la tenemos
            if (hitTestSourceRequested === false) {
                session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                    session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                        hitTestSource = source;
                    });
                });

                // Ya no necesitamos el listener 'end' aquí, lo maneja el botón
                // session.addEventListener('end', function () { ... });

                hitTestSourceRequested = true;
            }

            // Obtener resultados del hit-test
            if (hitTestSource) {
                const hitTestResults = frame.getHitTestResults(hitTestSource);

                if (hitTestResults.length > 0) {
                    // Superficie encontrada
                    const hit = hitTestResults[0];
                    reticle.visible = true;
                    // Actualizar la posición y orientación de la retícula
                    reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                } else {
                    // No se encontró superficie
                    reticle.visible = false;
                }
            }
        }

        // Renderizar la escena
        renderer.render(scene, camera);

     } else {
          // Si no estamos en modo AR, podríamos renderizar una vista normal
          // o simplemente no hacer nada si la app es solo AR.
          // Por ahora, no hacemos nada si no está presentando XR.
          // renderer.render(scene, camera); // Descomentar si quieres ver algo fuera de AR
     }
}
