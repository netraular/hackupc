import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOExporter } from 'three/addons/exporters/DRACOExporter.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Variables globales del módulo
let carMesh = null;
let mixer = null;
let animations = [];
let scene, camera, controls; // Referencias de Three.js
let animacionActual = null;
let action = null; // Variable para almacenar la acción actual

/** Carga el modelo GLB */
function loadCarModel(modelUrl, targetScene) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(modelUrl, (gltf) => {
            carMesh = gltf.scene;
            scene = targetScene; // Guardar referencia de la escena globalmente
            carMesh.traverse((child) => {
                if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
            });
            carMesh.position.y = 0;
            scene.add(carMesh);
            animations = gltf.animations || [];
            console.log('AAAAAAAAAAAAAAAAAAAAAA');
            console.log(animations);
            mixer = animations.length > 0 ? new THREE.AnimationMixer(carMesh) : null;
            console.log(`Modelo cargado: ${modelUrl}, ${animations.length} animaciones encontradas.`);
            if (!mixer) console.warn("Modelo sin animaciones, mixer no creado.");
            resolve({ mesh: carMesh, mixer, animations }); // Resolvemos con los datos importantes
        }, undefined, (error) => {
            console.error('Error cargando modelo GLB:', error);
            reject(error);
        });
    });
}

/** Reproduce una animación por índice */
function playCarAnimation(index) {
    if (!mixer) { console.warn("[playCarAnimation] Mixer no disponible."); return; }
    // Comprobamos si el array de animaciones existe y tiene el índice solicitado
    if (!animations || index < 0 || index >= animations.length) {
        console.warn(`[playCarAnimation] Animación con índice ${index} no encontrada o fuera de rango.`);
        return;
    }
    const animation = animations[index];
    if (!animation) { // Doble check por si hay un hueco en el array
        console.warn(`[playCarAnimation] El objeto de animación en el índice ${index} es inválido.`);
        return;
    }
    console.log(`[playCarAnimation] Reproduciendo: ${animation.name || `Animación ${index}`} (índice ${index})`);
    try {
        action = mixer.clipAction(animation);
        action.reset().setLoop(THREE.LoopOnce, 1).clampWhenFinished = true;
        if (animacionActual !== null){
            console.log(`[playCarAnimation] Deteniendo animación anterior: ${animacionActual}`);
            const clip = animacionActual.getClip();
            handleStopAnimation(animacionActual, clip);
            
        }
        animacionActual = action; // Guardar la acción actual
        // mixer.stopAllAction(); // Descomentar si quieres que cada animación detenga las anteriores
        action.play();
        console.log(`[playCarAnimation] Animación ${index} iniciada.`);
    } catch (error) {
        console.error(`[playCarAnimation] Error al reproducir animación ${index}:`, error);
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

/** Cambia a vista interior */
function setInsideView() { // Ya no necesita argumentos, usa las variables globales del módulo
    if (!carMesh || !controls || !camera) {
        console.warn("[setInsideView] Faltan elementos globales: carMesh, controls o camera.");
        return;
    }
    const insidePositionRelative = new THREE.Vector3(0.3, 1.1, -0.2); // Ajustar según tu modelo
    const lookAtTargetRelative = new THREE.Vector3(0, 1, 5);       // Ajustar según tu modelo

    // Es importante clonar los vectores para no modificar los originales
    const worldPosition = carMesh.localToWorld(insidePositionRelative.clone());
    const worldTarget = carMesh.localToWorld(lookAtTargetRelative.clone());

    camera.position.copy(worldPosition);
    controls.target.copy(worldTarget);
    controls.update(); // Muy importante para aplicar los cambios
    console.log("[setInsideView] Vista interior activada.");
}

/** Configura listeners para los botones del PANEL FAB */
function setupUIListeners(currentCamera, currentControls) {
    // Guardar referencias globales
    camera = currentCamera;
    controls = currentControls;

    console.log("[setupUIListeners] Configurando listeners para controles del panel FAB...");

    // --- 1. Botones de Animación del PANEL FAB ---
    const fabAnimSelector = '#panel-section-test .panel-button[data-panel-animation]';
    const fabAnimationButtons = document.querySelectorAll(fabAnimSelector);
    console.log(`[setupUIListeners] Botones de animación FAB encontrados: ${fabAnimationButtons.length}`);

    fabAnimationButtons.forEach(btn => {
        // El botón empieza 'disabled' desde el HTML
        const animIndex = parseInt(btn.dataset.panelAnimation, 10);

        if (isNaN(animIndex)) {
            console.warn(`[setupUIListeners] Botón FAB con data-panel-animation inválido, permanecerá deshabilitado:`, btn);
            // Ya está disabled por HTML, opcionalmente reforzar estilos:
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            return;
        }

        // Comprueba si la animación existe en el array cargado
        if (animations && animIndex >= 0 && animIndex < animations.length && animations[animIndex]) {
            // La animación EXISTE -> HABILITAR el botón
            console.log(`[setupUIListeners] Habilitando botón FAB Anim ${animIndex}`);
            btn.disabled = false; // *** QUITAR el atributo disabled ***
            // Aplicar estilos de habilitado (puede ser redundante si :disabled CSS funciona bien)
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';

            // Añadir el listener (limpiar antes por si acaso)
            const handler = () => {
                 console.log(`%c[FAB Click] Botón Animación ${animIndex} pulsado!`, 'color: blue; font-weight: bold;');
                 if (carMesh && mixer) {
                     playCarAnimation(animIndex);
                 } else {
                      console.warn(`[FAB Click] No se puede reproducir Anim ${animIndex}: carMesh o mixer no listos.`);
                 }
            };
            btn.removeEventListener('click', handler);
            btn.addEventListener('click', handler);

        } else {
            // La animación NO EXISTE -> DEJAR DESHABILITADO
            console.warn(`[setupUIListeners] Animación ${animIndex} no encontrada. Botón FAB permanecerá deshabilitado.`);
            // Asegurarse de que sigue deshabilitado (ya debería estarlo por HTML)
            btn.disabled = true;
            // Aplicar/reforzar estilos de deshabilitado (redundante si CSS :disabled funciona)
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            // No añadir listener si está deshabilitado
        }
    });

    // --- 2. Botón de Vista Interior del PANEL FAB ---
    const fabInsideSelector = '#panel-section-test .panel-button[data-panel-action="insideView"]';
    const panelInsideBtn = document.querySelector(fabInsideSelector);

    if (panelInsideBtn) {
        // Este botón depende solo de que el modelo (carMesh) esté cargado.
        // Como setupUIListeners se llama DESPUÉS de loadCarModel, podemos habilitarlo.
        console.log(`[setupUIListeners] Habilitando botón FAB vista interior.`);
        panelInsideBtn.disabled = false; // *** QUITAR el atributo disabled ***
        // Aplicar estilos de habilitado
        panelInsideBtn.style.opacity = '1';
        panelInsideBtn.style.cursor = 'pointer';

        // Añadir listener (limpiar antes)
        const handler = () => {
             console.log("%c[FAB Click] Botón Vista Interior pulsado!", 'color: purple; font-weight: bold;');
             if (carMesh && controls && camera) {
                 setInsideView(); // Usa variables globales
             } else {
                 console.warn("[FAB Click] No se puede activar vista interior: faltan carMesh, controls o camera.");
             }
        };
        panelInsideBtn.removeEventListener('click', handler);
        panelInsideBtn.addEventListener('click', handler);

    } else {
        console.warn("[setupUIListeners] Botón FAB vista interior NO encontrado.");
        // No hay nada que hacer si no se encuentra
    }

    console.log("[setupUIListeners] Configuración de listeners del FAB finalizada.");
}


/** Exportar a Draco */
function exportToDraco() {
    if (!carMesh) { console.warn("No hay modelo cargado para exportar."); return; }
    const exporter = new DRACOExporter();
    const options = {
        decodeSpeed: 5,
        encodeSpeed: 5,
        encoderMethod: DRACOExporter.MESH_EDGEBREAKER_ENCODING,
        quantization: [16, 8, 8, 8, 8],
        exportUvs: true,
        exportNormals: true,
        exportColor: false
    };
    console.log("Iniciando exportación a Draco...");
    const result = exporter.parse(carMesh, options);
    // Crear un enlace para descargar (ejemplo)
    const blob = new Blob([result], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'coche_exportado.drc';
    link.click();
    console.log("Exportación a Draco finalizada y descarga iniciada.");
    URL.revokeObjectURL(link.href); // Limpiar URL del objeto
}

/** Función principal de inicialización */
async function initCarExperience(threeElements, modelUrl, panelImageUrl) { // panelImageUrl ya no se usa
    scene = threeElements.scene;
    camera = threeElements.camera;
    controls = threeElements.controls;

    console.log("[initCarExperience] Iniciando...");
    if (!scene || !camera || !controls || !modelUrl) {
        throw new Error("[initCarExperience] Faltan elementos esenciales.");
    }
    try {
        console.log("[initCarExperience] Cargando modelo...");
        // ****** LA CARGA OCURRE AQUÍ ******
        await loadCarModel(modelUrl, scene);
        // ****** MODELO CARGADO, 'animations' YA TIENE DATOS ******

        console.log("[initCarExperience] Modelo cargado. Configurando listeners UI (SOLO FAB)...");
        // ****** SETUPUILISTENERS SE LLAMA DESPUÉS DE LA CARGA ******
        setupUIListeners(camera, controls); // Ahora habilitará/deshabilitará correctamente


        console.log("[initCarExperience] Inicialización completada exitosamente.");
    } catch (error) {
        console.error("[initCarExperience] Fallo CRÍTICO:", error);
        throw error;
    }
}


/** Función de actualización (bucle) */
function updateCarExperience(delta) {
    if (mixer) {
        mixer.update(delta); // Actualizar el mixer de animación si existe
    }
    // No es necesario actualizar controls aquí si OrbitControls está en threeSetup.js
}

// Exportar funciones públicas
export { initCarExperience, updateCarExperience };