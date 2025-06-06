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
                // --- GESTURE: Ensure overlay elements don't trigger rotation/scaling ---
                // Prevent touch events on the overlay itself from bubbling down
                overlay.addEventListener('touchstart', (e) => e.stopPropagation());
                overlay.addEventListener('touchmove', (e) => e.stopPropagation());
                overlay.addEventListener('touchend', (e) => e.stopPropagation());

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
             errorDiv.innerHTML = 'Tu dispositivo no soporta WebXR.<br/>Prueba con Chrome en Android o un visor compatible. También puedes visitar <a href="https://hackupc.raular.com" target="_blank">hackupc.raular.com</a> para una experiencia inmersiva sin AR.';


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

// --- GESTURE: State variables for touch interaction ---
let isDragging = false;
let isPinching = false;
let initialPinchDistance = 0;
let previousTouchX = 0;
let initialScale = new THREE.Vector3(1, 1, 1); // Initialize with default scale
const ROTATION_SPEED = 0.005; // Adjust sensitivity as needed
// --- GESTURE: END ---

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

    document.addEventListener('close-trunk', function() {
        stopAnimationActual(clip[4], mixer);
    });

    document.addEventListener('open_r_b_door', function() {
        doAnimation(3, clip[3], mixer);
    });

    document.addEventListener('close_r_b_door', function() {
        stopAnimationActual(clip[3], mixer);
    });

    document.addEventListener('open_l_b_door', function() {
        doAnimation(2, clip[2], mixer);
    });

    document.addEventListener('close_l_b_door', function() {
        stopAnimationActual(clip[2], mixer);
    });

    document.addEventListener('open_l_f_door', function() {
        doAnimation(0, clip[0], mixer);
    });

    document.addEventListener('close_l_f_door', function() {
        stopAnimationActual(clip[0], mixer);
    });

    document.addEventListener('open_r_f_door', function() {
        doAnimation(1, clip[1], mixer);
    });

    document.addEventListener('close_r_f_door', function() {
        stopAnimationActual(clip[1], mixer);
    });

    document.addEventListener('open-charger', function() {
        doAnimation(5, clip[5], mixer);
    });

    document.addEventListener('open-roof', function() {
        doAnimation(6, clip[6], mixer);
    });

    document.addEventListener('close-roof', function() {
        stopAnimationActual(clip[6], mixer);
    });

    document.addEventListener('open_l_wheels', function() {
        doAnimation(8, clip[8], mixer);
    });

    document.addEventListener('close_l_wheels', function() {
        stopAnimationActual(clip[8], mixer);
    });

    document.addEventListener('open_r_wheels', function() {
        doAnimation(7, clip[7], mixer);
    });

    document.addEventListener('close_r_wheels', function() {
        stopAnimationActual(clip[7], mixer);
    });

    function doAnimation(indexAnimation, animation, localMixer) { // Renombrado mixer a localMixer para evitar confusión
        if (!localMixer || !animation) { // Añadida comprobación para animation
            console.warn("El mixer o la animación no están listos para el índice:", indexAnimation);
            return;
        }
        // Intentar obtener la acción
        try {
             action = localMixer.clipAction(animation);
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
    function stopAllAnimations(mixer) {
        if (!mixer) {
          console.warn("El modelo o el mixer aún no están listos");
          return;
        }
        mixer._actions.forEach((action) => {
          const clip = action.getClip();
          handleStopAnimation(action, clip);
        });
      }

      // 1) Defino la función globalmente
      function stopAnimationActual(animation, mixer) {
        if (!mixer) {
          console.warn("El modelo o el mixer aún no están listos");
          return;
        }
        const myAnimation = mixer.existingAction(animation);
        if (myAnimation) {
          const clip = action.getClip();
          handleStopAnimation(myAnimation, clip);
        }
      }

      function handleStopAnimation(animation, clip) {
        animation.reset();
        animation.clampWhenFinished = true;
        animation.setLoop(THREE.LoopOnce, 0);
        animation.timeScale = -action.timeScale; // invierte dirección
        animation.time =
          animation.timeScale < 0
            ? clip.duration // si ahora va hacia atrás, empezar desde el final
            : 0; // si va hacia adelante, desde el principio
        animation.play();
      }

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0xffffff, 1.4)); // Slightly increased ambient light

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
    directionalLight.position.set(1, 1.5, 1).normalize();
    scene.add(directionalLight);

    // Optional: Add another light from a different angle
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, 1, -1).normalize();
    scene.add(directionalLight2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // Habilitar WebXR
    container.appendChild(renderer.domElement);

    // --- Botón AR ---
    const arButtonContainer = document.getElementById('ar-button-container');
    const infoElement = document.getElementById('info');

    const button = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test', 'dom-overlay'], // Added dom-overlay
        domOverlay: { root: document.body } // Specify overlay root if needed by ARButton internals, check ARButton source if issue arises
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
         isDragging = false;
         isPinching = false;
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

            // Set an initial scale to ensure the car is visible and properly sized
            // placedObject.scale.set(0.5, 0.5, 0.5); // Start at half size
            initialScale.copy(placedObject.scale); // Store initial scale

            console.log('Model loaded with initial scale:', placedObject.scale);

            mixer = new THREE.AnimationMixer(placedObject);
            animation1 = window.document.getElementById("animation1");
            clip = gltf.animations;
            
            mixer.addEventListener("finished", (e) => {
                console.log("finished animating"); 
            });
        },
        undefined,
        function (error) {
            console.error("Error loading 3D model:", error);
        }
);

function animate() {
    //
    if (mixer) {
      mixer.update(0.01);
    }
  }
  // --- GESTURE: Touch Handlers ---

function onTouchStart(event) {
    // Only interact if the object is placed and visible
    if (!placedObject || !placedObject.visible || !renderer.xr.isPresenting) {
        return;
    }

    // Log touch event for debugging
    console.log('Touch event started', event.touches.length);

    const touches = event.touches;

    if (touches.length === 2) {
        // Check if this is a pinch or rotation gesture
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Store initial position for rotation calculation
        previousTouchX = (touches[0].clientX + touches[1].clientX) / 2;
        
        // We'll determine if it's a pinch or rotation in the move handler
        isDragging = true;
        isPinching = true;
        
        // Store initial scale - make sure we have a valid initial scale
        if (placedObject.scale.x !== 0 && placedObject.scale.y !== 0 && placedObject.scale.z !== 0) {
            initialScale.copy(placedObject.scale);
        } else {
            // Default scale if the object scale is invalid
            initialScale.set(1, 1, 1);
        }
        
        console.log('Initial scale set to:', initialScale);
        
        event.preventDefault(); // Prevent browser scrolling/zooming
        event.stopPropagation(); // Stop event from bubbling up
    } else {
        // Not a two-finger gesture
        isDragging = false;
        isPinching = false;
    }
}

function onTouchMove(event) {
    if (!placedObject || !placedObject.visible || !renderer.xr.isPresenting) {
        return;
    }

    const touches = event.touches;

    if (touches.length === 2) {
        // Calculate current values
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);
        const currentTouchX = (touches[0].clientX + touches[1].clientX) / 2;
        
        // Handle rotation (based on the midpoint of the two fingers)
        if (isDragging) {
            const deltaX = currentTouchX - previousTouchX;
            placedObject.rotation.y += deltaX * ROTATION_SPEED;
            previousTouchX = currentTouchX;
            console.log('Rotating object, deltaX:', deltaX);
        }
        
        // Handle scaling
        if (isPinching && initialPinchDistance > 0) {
            const scaleFactor = currentPinchDistance / initialPinchDistance;
            
            // Apply the scale more directly and explicitly
            const newScale = new THREE.Vector3(
                initialScale.x * scaleFactor,
                initialScale.y * scaleFactor,
                initialScale.z * scaleFactor
            );
            
            // Apply bounds to prevent extreme scaling
            const minScale = 0.1;
            const maxScale = 5.0;
            
            newScale.x = Math.max(minScale, Math.min(maxScale, newScale.x));
            newScale.y = Math.max(minScale, Math.min(maxScale, newScale.y));
            newScale.z = Math.max(minScale, Math.min(maxScale, newScale.z));
            
            // Set the new scale
            placedObject.scale.copy(newScale);
            
            console.log('Scaling object, factor:', scaleFactor, 'New scale:', newScale);
        }
        
        event.preventDefault();
        event.stopPropagation(); // Ensure the event doesn't bubble up
    }
}

function onTouchEnd(event) {
    if (!placedObject || !placedObject.visible || !renderer.xr.isPresenting) {
        return;
    }
    
    // Reset flags when touches end
    if (event.touches.length < 2) {
        isDragging = false;
        isPinching = false;
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



    // --- GESTURE: Add Touch Event Listeners to the Canvas ---
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false, capture: true }); // Use capture phase
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { capture: true });
    
    // Add these event listeners to document as well for better touch capture
    document.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true });
    
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
    
    // Don't place the object if we're currently dragging or pinching
    if (isDragging || isPinching) {
        console.log('Ignored object placement during rotation/scaling');
        return;
    }
    
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
