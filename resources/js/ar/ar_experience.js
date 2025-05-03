// Import statements need to come first, before any other code
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Only log after imports are complete
console.log('ImportMap correctly loaded');

const loader = new GLTFLoader();

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

                const animationButton = document.createElement('button');
                animationButton.id = 'animation1';
                animationButton.textContent = 'animation 1';
                animationButton.style.position = 'absolute';
                animationButton.style.left = '20px';
                animationButton.style.top = '20px';
                animationButton.style.zIndex = '10000'; // Higher z-index
                animationButton.style.padding = '10px 20px'; // More padding
                animationButton.style.backgroundColor = 'rgba(255, 50, 50, 0.7)'; // More visible color
                animationButton.style.color = 'white';
                animationButton.style.border = '2px solid white';
                animationButton.style.borderRadius = '5px';
                animationButton.style.fontSize = '16px';
                animationButton.style.fontWeight = 'bold';
                animationButton.style.cursor = 'pointer';
                
                // Touch events for mobile
                animationButton.addEventListener('touchstart', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('Animation button touched');
                    const evt = new CustomEvent('open-car-trunk');
                    document.dispatchEvent(evt);
                }, true); // Use capture phase
                
                overlay.appendChild(animationButton);

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
            button.textContent = 'AR NOT SUPPORTED';
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

let mixer = "";
let action = "";
let clip = "";
let animation1 = "";

init();
// La animación se inicia/detiene por el botón AR

function init() {
    const container = document.createElement('div'); // Contenedor para el canvas
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    document.addEventListener('open-trunk', function() {
        doAnimation(4, clip[4], mixer);
    });

    document.addEventListener('open_r_b_door', function() {
        doAnimation(3, clip[3], mixer);
    });

    document.addEventListener('open_l_b_door', function() {
        doAnimation(2, clip[2], mixer);
    });

    document.addEventListener('open_l_f_door', function() {
        doAnimation(0, clip[0], mixer);
    });

    document.addEventListener('open_r_f_door', function() {
        doAnimation(1, clip[1], mixer);
    });

    document.addEventListener('open-charger', function() {
        doAnimation(5, clip[5], mixer);
    });

    document.addEventListener('open-roof', function() {
        doAnimation(6, clip[6], mixer);
    });

    document.addEventListener('open_l_wheels', function() {
        doAnimation(8, clip[8], mixer);
    });

    document.addEventListener('open_r_wheels', function() {
        doAnimation(7, clip[7], mixer);
    });

    function doAnimation(indexAnimation, animation, localMixer) { // Renombrado mixer a localMixer para evitar confusión
        if (!localMixer || !animation) { // Añadida comprobación para animation
            console.warn("El mixer o la animación no están listos para el índice:", indexAnimation);
            return;
        }
        // Intentar obtener la acción
        try {
             const action = localMixer.clipAction(animation);
             if (!action) {
                 console.warn("No se pudo crear la acción para la animación:", animation.name);
                 return;
             }
             action.reset();
             action.setLoop(THREE.LoopOnce, 1);
             action.clampWhenFinished = true;
             action.zeroSlopeAtEnd = true; // Considera si realmente necesitas esto
             action.timeScale = 1; // O ajusta según necesites
             action.play();
        } catch (error) {
             console.error("Error al intentar reproducir la animación:", indexAnimation, error);
        }
    }
    // --- Luces ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0).normalize();
    scene.add(directionalLight);

    // --- Más fuentes de luz ---
    // Adding a Point Light (which emits light in all directions)
    const pointLight = new THREE.PointLight(0xffffff, 1, 10); // White light, intensity: 1, distance: 10
    pointLight.position.set(0, 2, 5); // Position it in front of the car
    scene.add(pointLight);

    // Adding a SpotLight (can focus light in a specific direction)
    const spotLight = new THREE.SpotLight(0xffffff, 2, 10, Math.PI / 4, 0.5, 1); // Intensity: 2, distance: 10
    spotLight.position.set(2, 5, 5); // Position it above the scene to highlight the model
    scene.add(spotLight);

    // Adding a helper to visualize the spot light (Optional, for debugging)
    const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    scene.add(spotLightHelper);

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

    // Set up a listener for our custom animation event
    document.addEventListener('open-car-trunk', function() {
        if (mixer && action) {
            // Set button color to blue
            button.style.backgroundColor = 'rgba(50, 50, 255, 0.7)'; // Cambiar color a azul
            // Reset to frame 0
            action.reset();
            // Only animate once
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            // Smooth slope at end
            action.zeroSlopeAtEnd = true;
            // Increase animation speed
            action.timeScale = 5;
            // Start animation
            action.play();
            console.log("Animation triggered via custom event");
        } else {
            console.warn("Mixer or action not available yet");
        }
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

    loader.load(
        '3dmodel/oficial_3.glb',
        function (gltf) {
            placedObject = gltf.scene;
            placedObject.visible = false;
            scene.add(placedObject);

            // Scale the model to 10% of its original size
            // placedObject.scale.set(0.1, 0.1, 0.1);

            mixer = new THREE.AnimationMixer(placedObject);

            animation1 = window.document.getElementById("animation1");

            clip = gltf.animations;
            
            // 7) Cuando el mixer dispare el evento "finished"
            mixer.addEventListener("finished", (e) => {
                console.log("finished animating"); 
            });
        },
        undefined,
        function (error) {
        console.error("Error al cargar car.glb:", error);
        }
);

// Update the animation mixer inside the render loop
// function animate() {
//     if (mixer) {
//         mixer.update(0.01); // Update animations by a small time step (you can tweak this)
//     }
// }

function animate() {
    //
    if (mixer) {
      mixer.update(0.01);
    }
  }


function renderLoop(timestamp, frame) {
    if (renderer.xr.isPresenting) { // Only process AR if the session is active
        if (frame) { // The frame object only exists inside an XR session
            const referenceSpace = renderer.xr.getReferenceSpace();
            const session = renderer.xr.getSession();

            // Request hit-test source if we don't have it
            if (hitTestSourceRequested === false) {
                session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                    session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                        hitTestSource = source;
                    });
                });

                hitTestSourceRequested = true;
            }

            // Get hit-test results
            if (hitTestSource) {
                const hitTestResults = frame.getHitTestResults(hitTestSource);

                if (hitTestResults.length > 0) {
                    // Surface found
                    const hit = hitTestResults[0];
                    reticle.visible = true;
                    // Update the position and orientation of the reticle
                    reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                } else {
                    // No surface found
                    reticle.visible = false;
                }
            }
        }

        // Update animations in the render loop
        animate();

        // Render the scene
        renderer.render(scene, camera);
    }
}



    // --- Eventos y Bucle de Renderizado ---
    window.addEventListener('resize', onWindowResize);
    renderer.setAnimationLoop(renderLoop); // Iniciar bucle
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSelect(event) {
    // Check if the event originated from our animation button and skip if so
    // if (event.target && (event.target.id === 'animation1' || event.target.closest('#animation1'))) {
    //     console.log('Ignoring onSelect because it came from animation button');
    //     return;
    // }
    
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
