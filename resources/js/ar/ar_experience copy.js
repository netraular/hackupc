// Import statements need to come first, before any other code
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Only log after imports are complete
console.log('ImportMap correctly loaded');

const loader = new GLTFLoader();

// --- INICIO: Código de ARButton.js (pegado directamente aquí) ---
// (Your ARButton class code remains exactly the same here)
class ARButton {
    static createButton( renderer, sessionInit = {} ) {
        const button = document.createElement( 'button' );

        function showStartAR( /*device*/ ) {
            if ( sessionInit.domOverlay === undefined ) {
                const overlay = document.createElement( 'div' );
                overlay.style.display = 'none';
                document.body.appendChild( overlay );

                // --- START: Your Animation Button Code ---
                const animationButton = document.createElement('button');
                animationButton.id = 'animation1';
                animationButton.textContent = 'animation 1'; // You might want more descriptive text
                animationButton.style.position = 'absolute';
                animationButton.style.left = '20px';
                animationButton.style.top = '20px'; // Position might need adjustment
                animationButton.style.zIndex = '10000';
                animationButton.style.padding = '10px 20px';
                animationButton.style.backgroundColor = 'rgba(255, 50, 50, 0.7)';
                animationButton.style.color = 'white';
                animationButton.style.border = '2px solid white';
                animationButton.style.borderRadius = '5px';
                animationButton.style.fontSize = '16px';
                animationButton.style.fontWeight = 'bold';
                animationButton.style.cursor = 'pointer';

                // Touch events for mobile (Added preventDefault and stopPropagation)
                animationButton.addEventListener('touchstart', function(event) {
                    event.preventDefault(); // Prevent default touch actions like scrolling
                    event.stopPropagation(); // Stop the event from bubbling up to the canvas
                    console.log('Animation button touched');
                    // --- TODO: Trigger your *specific* animation here ---
                    // Example: You might want to link this button to a specific animation index
                    // For now, let's assume it triggers the first animation if available
                     if (mixer && clip && clip.length > 0) {
                         doAnimation(0, clip[0], mixer); // Trigger the first animation
                     } else {
                         console.warn("Mixer or animations not ready for button press");
                     }
                    // const evt = new CustomEvent('open-car-trunk'); // Keep if needed elsewhere
                    // document.dispatchEvent(evt);
                }, true); // Use capture phase is fine

                overlay.appendChild(animationButton);
                // --- END: Your Animation Button Code ---


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

            // ... (rest of showStartAR)
             let currentSession = null;

             async function onSessionStarted( session ) {
                 session.addEventListener( 'end', onSessionEnded );
                 renderer.xr.setReferenceSpaceType( 'local' );
                 await renderer.xr.setSession( session );
                 button.textContent = 'STOP AR';
                 if (sessionInit.domOverlay) sessionInit.domOverlay.root.style.display = ''; // Show overlay

                 currentSession = session;
                  // Disparar evento personalizado o llamar a una función cuando la sesión empieza
                  button.dispatchEvent(new CustomEvent('sessionstart'));
             }

             function onSessionEnded( /*event*/ ) {
                 currentSession.removeEventListener( 'end', onSessionEnded );
                 button.textContent = 'START AR';
                 if (sessionInit.domOverlay) sessionInit.domOverlay.root.style.display = 'none'; // Hide overlay

                 currentSession = null;
                  // Disparar evento personalizado o llamar a una función cuando la sesión termina
                  button.dispatchEvent(new CustomEvent('sessionend'));
             }

             button.style.display = '';
             button.style.cursor = 'pointer';
             button.textContent = 'START AR';
             button.onclick = function () {
                 if ( currentSession === null ) {
                     navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );
                 } else {
                     currentSession.end();
                 }
             };
        }

        function disableButton() {
            // ... (rest of disableButton)
            button.style.display = '';
            button.style.cursor = 'auto';
            button.onmouseenter = null;
            button.onmouseleave = null;
            button.onclick = null;
        }

        function showARNotSupported() {
            disableButton();
            button.textContent = 'AR NOT SUPPORTED';
             // ... (rest of showARNotSupported)
             const errorDiv = document.createElement('div');
             errorDiv.className = 'ar-error-message'; // Use CSS for styling
             errorDiv.innerHTML = 'Tu navegador o dispositivo no soporta WebXR para Realidad Aumentada.<br/>Prueba con Chrome en un dispositivo Android compatible o un visor WebXR en iOS.';
             document.body.appendChild(errorDiv);
        }

        function showARNotAllowed( exception ) {
            disableButton();
            console.warn( 'Exception when trying to call xr.isSessionSupported', exception );
            button.textContent = 'AR NOT ALLOWED';
             // ... (rest of showARNotAllowed)
              const errorDiv = document.createElement('div');
             errorDiv.className = 'ar-error-message'; // Use CSS for styling
             errorDiv.innerHTML = 'Permiso denegado para acceder a la Realidad Aumentada.<br/> Revisa los permisos de cámara y sensores de movimiento en la configuración de tu navegador.';
             document.body.appendChild(errorDiv);
        }

        // stylizeElement function is not needed if using external CSS

        if ( 'xr' in navigator ) {
            button.id = 'ARButton';
            // Apply CSS class instead of inline styles if preferred
            // button.classList.add('ar-button-style');

            navigator.xr.isSessionSupported( 'immersive-ar' ).then( function ( supported ) {
                supported ? showStartAR() : showARNotSupported();
            } ).catch( showARNotAllowed );

            return button;
        } else {
            // ... (rest of the 'else' block for WebXR not available)
            const message = document.createElement( 'a' );
            if ( window.isSecureContext === false ) {
                message.href = document.location.href.replace( /^http:/, 'https:' );
                message.innerHTML = 'WEBXR NEEDS HTTPS';
            } else {
                message.href = 'https://immersiveweb.dev/';
                message.innerHTML = 'WEBXR NOT AVAILABLE';
            }
            message.style.textDecoration = 'none';
            message.classList.add('ar-error-message'); // Use CSS for styling
            // Position it using CSS if possible
            message.style.position = 'absolute';
            message.style.left = 'calc(50% - 90px)';
            message.style.bottom = '20px';
            message.style.width = '180px';


            return message;
        }
    }
}
// --- FIN: Código de ARButton.js ---


// --- INICIO: Lógica de la aplicación AR ---
let camera, scene, renderer;
let controller;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
let placedObject = null; // Reference to the loaded GLB model
let mixer = null;       // Initialize mixer to null
let clips = [];         // Store all animation clips

// --- GESTURE: State variables for touch interaction ---
let isDragging = false;
let isPinching = false;
let initialPinchDistance = 0;
let previousTouchX = 0;
let initialScale = new THREE.Vector3(); // To store scale when pinch starts
const ROTATION_SPEED = 0.005; // Adjust sensitivity as needed
// --- GESTURE: END ---

init();
// Animation is started by AR interactions or buttons

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40); // Increased far plane

    // --- Animation Setup ---
    // Removed specific event listeners here, assuming buttons or other UI trigger doAnimation
    // Add them back if specific DOM events are still needed for animations
    // Example:
    // document.addEventListener('open-trunk', function() {
    //     if (mixer && clips.length > 4) doAnimation(4, clips[4], mixer);
    // });
    // ... other animation event listeners

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

    function doAnimation(indexAnimation, animation, localMixer) {
        if (!localMixer || !animation) {
            console.warn("Mixer or animation not ready for index:", indexAnimation);
            return;
        }
        try {
            const action = localMixer.clipAction(animation);
            if (!action) {
                console.warn("Could not create action for animation:", animation.name);
                return;
            }
            action.reset();
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            // action.zeroSlopeAtEnd = true; // Can sometimes cause issues, test if needed
            action.timeScale = 1; // Adjust speed if necessary
            action.play();
            console.log(`Playing animation: ${animation.name}`);
        } catch (error) {
            console.error("Error playing animation:", indexAnimation, error);
        }
    }

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.7)); // Slightly increased ambient light

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
    directionalLight.position.set(1, 1.5, 1).normalize();
    scene.add(directionalLight);

    // Optional: Add another light from a different angle
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, 1, -1).normalize();
    scene.add(directionalLight2);


    // --- Renderer ---
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // --- AR Button ---
    const arButtonContainer = document.getElementById('ar-button-container'); // Make sure this exists in your HTML
     if (!arButtonContainer) {
         console.warn("Element with ID 'ar-button-container' not found. Creating one.");
         const defaultContainer = document.createElement('div');
         defaultContainer.id = 'ar-button-container';
         defaultContainer.style.position = 'absolute';
         defaultContainer.style.bottom = '30px';
         defaultContainer.style.width = '100%';
         defaultContainer.style.textAlign = 'center';
         defaultContainer.style.zIndex = '9999'; // Ensure it's above other elements
         document.body.appendChild(defaultContainer);
         arButtonContainer = defaultContainer;
     }

    const infoElement = document.getElementById('info'); // Make sure this exists in your HTML
     if (!infoElement) {
         console.warn("Element with ID 'info' not found. Creating one.");
         const defaultInfo = document.createElement('div');
         defaultInfo.id = 'info';
         defaultInfo.textContent = 'Move phone to find a surface, then tap to place.';
         defaultInfo.style.position = 'absolute';
         defaultInfo.style.top = '10px';
         defaultInfo.style.width = '100%';
         defaultInfo.style.textAlign = 'center';
         defaultInfo.style.color = 'white';
         defaultInfo.style.backgroundColor = 'rgba(0,0,0,0.5)';
         defaultInfo.style.padding = '10px';
         defaultInfo.style.display = 'none'; // Initially hidden
         defaultInfo.style.zIndex = '9998';
         document.body.appendChild(defaultInfo);
         infoElement = defaultInfo;
     }


    const button = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test', 'dom-overlay'], // Added dom-overlay
        domOverlay: { root: document.body } // Specify overlay root if needed by ARButton internals, check ARButton source if issue arises
    });

    // Listener for specific animation button in the overlay (handled inside ARButton now)

    // AR Session Start/End UI handling
    button.addEventListener('sessionstart', () => {
        infoElement.style.display = 'block'; // Show instructions
        if (placedObject) placedObject.visible = false; // Hide object when starting new session
        reticle.visible = true; // Show reticle immediately
    });
    button.addEventListener('sessionend', () => {
        infoElement.style.display = 'none';
        if (placedObject) placedObject.visible = false; // Hide object on exit
        reticle.visible = false;
        hitTestSourceRequested = false;
        hitTestSource = null;
        // --- GESTURE: Reset interaction state on session end ---
        isDragging = false;
        isPinching = false;
    });

    arButtonContainer.appendChild(button);

    // --- Controller (for initial placement tap) ---
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect); // 'select' is the tap in AR
    scene.add(controller);

    // --- Reticle ---
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.08, 0.10, 32).rotateX(-Math.PI / 2), // Slightly larger reticle
        new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.8, transparent: true }) // More opaque
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false; // Initially hidden until session starts
    scene.add(reticle);

    // --- Model Loading ---
    // Use the URL from your example link: https://d2up16xgx6qr1.cloudfront.net/model/chair/FCA311.glb
    // Or keep your 'oficial_3.glb' if that's the correct one you want to use.
    // const modelUrl = 'https://d2up16xgx6qr1.cloudfront.net/model/chair/FCA311.glb';
    const modelUrl = '3dmodel/oficial_3.glb'; // Sticking with your original path

    loader.load(
        modelUrl,
        function (gltf) {
            console.log("GLB loaded successfully.");
            placedObject = gltf.scene;
            placedObject.visible = false; // Keep it hidden initially

            // --- GESTURE: Optional initial scaling ---
            // Adjust if the model is too large or small by default
            // placedObject.scale.set(0.5, 0.5, 0.5);

            scene.add(placedObject);

            // --- Animation Setup ---
            if (gltf.animations && gltf.animations.length) {
                console.log(`Found ${gltf.animations.length} animations.`);
                mixer = new THREE.AnimationMixer(placedObject);
                clips = gltf.animations; // Store all clips

                // Example: Log animation names
                clips.forEach((clip, index) => console.log(`Animation ${index}: ${clip.name}`));

                // You might want to prepare actions or play a default idle animation here if needed
                // mixer.clipAction(clips[0]).play(); // Example: Play the first animation immediately

            } else {
                console.log("No animations found in the model.");
            }

             // Add mixer finished listener if needed
             if(mixer) {
                 mixer.addEventListener("finished", (e) => {
                     console.log("Animation finished:", e.action.getClip().name);
                 });
             }

        },
        (xhr) => { // Progress callback
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error("Error loading GLB:", error);
            // Display error to user?
            infoElement.textContent = "Error loading 3D model.";
            infoElement.style.display = 'block';
            infoElement.style.color = 'red';
        }
    );

    // --- GESTURE: Add Touch Event Listeners to the Canvas ---
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false }); // passive: false to allow preventDefault
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);


    // --- Event Listeners & Render Loop ---
    window.addEventListener('resize', onWindowResize);
    renderer.setAnimationLoop(renderLoop); // Start the render loop
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- GESTURE: Touch Handlers ---

function onTouchStart(event) {
    // Only interact if the object is placed and visible
    if (!placedObject || !placedObject.visible || !renderer.xr.isPresenting) {
        return;
    }

    const touches = event.touches;

    if (touches.length === 1) {
        // Start Rotation
        isDragging = true;
        isPinching = false;
        previousTouchX = touches[0].clientX;
        event.preventDefault(); // Prevent browser scrolling/zooming
    } else if (touches.length === 2) {
        // Start Scaling
        isPinching = true;
        isDragging = false;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
        initialScale.copy(placedObject.scale); // Store the scale when pinch starts
        event.preventDefault(); // Prevent browser zooming
    }
}

function onTouchMove(event) {
    if (!placedObject || !placedObject.visible || !renderer.xr.isPresenting) {
        return;
    }

    const touches = event.touches;

    if (isDragging && touches.length === 1) {
        // Rotate
        const currentTouchX = touches[0].clientX;
        const deltaX = currentTouchX - previousTouchX;
        placedObject.rotation.y += deltaX * ROTATION_SPEED; // Rotate around Y axis
        previousTouchX = currentTouchX;
        event.preventDefault();
    } else if (isPinching && touches.length === 2) {
        // Scale
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);

        if (initialPinchDistance > 0) { // Avoid division by zero
            const scaleFactor = currentPinchDistance / initialPinchDistance;
            // Apply scale relative to the scale when the pinch started
            placedObject.scale.copy(initialScale).multiplyScalar(scaleFactor);
        }
        event.preventDefault();
    }
}

function onTouchEnd(event) {
     if (!placedObject || !placedObject.visible || !renderer.xr.isPresenting) {
        return;
    }
    // Reset flags when touches end
    if (event.touches.length < 2) {
        isPinching = false;
    }
    if (event.touches.length < 1) {
        isDragging = false;
    }
}
// --- GESTURE: END Touch Handlers ---

// --- GESTURE: Modified onSelect for initial placement only ---
function onSelect() {
    // Only place the object if the reticle is visible AND the object hasn't been placed yet
    if (reticle.visible && placedObject && !placedObject.visible) {
        placedObject.position.setFromMatrixPosition(reticle.matrix);
        // Optional: Align rotation with the surface normal (can look better)
        // Get the hit pose
        // const hitPose = frame.getHitTestResults(hitTestSource)[0]?.getPose(renderer.xr.getReferenceSpace());
        // if (hitPose) {
        //    placedObject.quaternion.setFromRotationMatrix(new THREE.Matrix4().fromArray(hitPose.transform.matrix));
        //    // Optional: Keep upright if desired (remove X and Z rotation components)
        //    const euler = new THREE.Euler().setFromQuaternion(placedObject.quaternion, 'YXZ');
        //    placedObject.quaternion.setFromEuler(new THREE.Euler(0, euler.y, 0, 'YXZ'));
        // }

        placedObject.visible = true;
        document.getElementById('info').style.display = 'none'; // Hide instructions

        // Optional: Hide the reticle once an object is placed if you only want one object
        // reticle.visible = false;
    }
    // Do NOT handle interaction logic here anymore. Touch handlers do that.
}


// Animation update function (called from render loop)
const clock = new THREE.Clock(); // Use a clock for smoother animation updates
function animate() {
    const delta = clock.getDelta();
    if (mixer) {
        mixer.update(delta); // Update with time delta
    }
}

function renderLoop(timestamp, frame) {
    if (renderer.xr.isPresenting) {
        animate(); // Update animations

        if (frame) {
            const referenceSpace = renderer.xr.getReferenceSpace();
            const session = renderer.xr.getSession();

            // Hit-testing logic (only needed if object not placed OR if reticle should always show)
            if (!placedObject || !placedObject.visible) { // Only do hit-testing before placement
                if (hitTestSourceRequested === false) {
                    session.requestReferenceSpace('viewer').then(function (viewerSpace) {
                       return session.requestHitTestSource({ space: viewerSpace });
                     }).then(function (source) {
                        hitTestSource = source;
                     }).catch(err => {
                        console.error("Error requesting hit test source:", err);
                         hitTestSourceRequested = false; // Allow retry?
                     });
                     hitTestSourceRequested = true;
                }

                if (hitTestSource) {
                    const hitTestResults = frame.getHitTestResults(hitTestSource);
                    if (hitTestResults.length > 0) {
                        const hit = hitTestResults[0];
                        const pose = hit.getPose(referenceSpace);
                        reticle.visible = true;
                        reticle.matrix.fromArray(pose.transform.matrix);
                    } else {
                        reticle.visible = false;
                    }
                }
            } else {
                 // Object is placed, hide reticle (or keep it visible if desired)
                 reticle.visible = false;
            }

        }

        renderer.render(scene, camera);
    }
    // No rendering needed if not presenting AR
}