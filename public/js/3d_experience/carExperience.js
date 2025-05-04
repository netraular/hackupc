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


//info del modelo
let overlay = "";
let imgEl = "";
let txtEl = "";
let closeBtn = "";
let isOpen = false; // para saber si el popup está abierto o no

const contenidoJson = [
        {
          descripcion:
            "Asistente que avisa visual y acústicamente de obstáculos al aparcar",
          animacion: 2,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Freno de mano eléctrico que se aplica y libera automáticamente",
          animacion: 6,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Pantalla táctil para multimedia, navegación y ajustes del coche",
          animacion: 4,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Mantiene velocidad y distancia con el vehículo delantero de forma automática",
          animacion: 7,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Realiza maniobras de estacionamiento automáticamente con sensores ultrasónicos",
          animacion: 1,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Acondicionamiento de aire estacionario para climatizar el habitáculo con el vehículo parado",
          animacion: 0,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Cambio de unidad de temperatura entre Celsius y Fahrenheit en el sistema Climatronic",
          animacion: 3,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Proyección de velocidad, navegación y avisos en el campo de visión del conductor (HUD)",
          animacion: 5,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Visualización dinámica de potencia de conducción y recuperación en el cuadro digital",
          animacion: 8,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Indicaciones en la instrumentación: velocidad, temperatura exterior y mensajes de servicio",
          animacion: 2,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Función de asientos calefactados inteligentes que aprende los hábitos de uso",
          animacion: 6,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Ventilación activa en los asientos delanteros para mayor confort",
          animacion: 1,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Protección antiahtrapamiento en la persiana del techo solar",
          animacion: 4,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Filtro de polvo y polen con carbón activo para purificar el aire interior",
          animacion: 7,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
        {
          descripcion:
            "Reconocimiento de ocupantes para ajustar el climatizador según asientos vacíos",
          animacion: 0,
          imagen: "3dmodel/imgs/carrito.jpg",
        },
      ];

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
            console.log('Modelo GLB cargado, Animaciones encontradas:', animations.map((a, i) => `${i}: ${a.name || 'Sin nombre'}`)); // Log mejorado
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
        console.warn(`[playCarAnimation] Animación con índice ${index} no encontrada o fuera de rango (Total: ${animations?.length ?? 0}).`);
        return;
    }
    const animation = animations[index];
    if (!animation) { // Doble check por si hay un hueco en el array
        console.warn(`[playCarAnimation] El objeto de animación en el índice ${index} es inválido.`);
        return;
    }
    const animationName = animation.name || `Animación ${index}`;
    console.log(`%c[playCarAnimation] Reproduciendo: ${animationName} (índice ${index})`, 'color: green; font-weight: bold;');

    try {
        // Detener la animación anterior (si existe y es diferente)
        if (animacionActual) {
            const currentClipName = animacionActual.getClip().name || `Animación ${animations.indexOf(animacionActual.getClip())}`;
             console.log(`[playCarAnimation] Deteniendo animación anterior: ${currentClipName}`);
             animacionActual.fadeOut(0.3); // Suavemente detiene la anterior
             // O usar handleStopAnimation si prefieres el rebobinado:
             // handleStopAnimation(animacionActual, animacionActual.getClip());
        }

        // Obtener y configurar la nueva acción
        action = mixer.clipAction(animation);
        action.reset()
              .setLoop(THREE.LoopOnce, 1) // Reproducir una sola vez
              .clampWhenFinished = true; // Mantener el estado final
        action.fadeIn(0.3); // Suavemente inicia la nueva
        action.play();

        animacionActual = action; // Guardar la nueva acción como la actual

        // Limpiar listener 'finished' para evitar duplicados
        mixer.removeEventListener('finished', onAnimationFinished); // Limpiar anterior
        mixer.addEventListener('finished', onAnimationFinished);  // Añadir nuevo

        console.log(`[playCarAnimation] Animación '${animationName}' iniciada.`);

    } catch (error) {
        console.error(`[playCarAnimation] Error al reproducir animación ${index} ('${animationName}'):`, error);
    }
}

// Callback cuando una animación termina
function onAnimationFinished(event) {
    const finishedAction = event.action;
    const clipName = finishedAction.getClip().name || `Animación ${animations.indexOf(finishedAction.getClip())}`;
    console.log(`[onAnimationFinished] Animación terminada: ${clipName}`);
    if (animacionActual === finishedAction) {
        // console.log("[onAnimationFinished] La animación terminada era la actual. Poniendo animacionActual a null.");
        // Opcional: decidir si quieres que animacionActual se ponga a null aquí o no.
        // Si se pone a null, la siguiente playCarAnimation no intentará detenerla.
        // Si no se pone a null, la siguiente playCarAnimation sí la detendrá (fadeOut).
        // animacionActual = null;
    }
     // Importante remover el listener para esta acción específica si no quieres que se acumulen
     // mixer.removeEventListener('finished', onAnimationFinished); // O limpiar todos y re-añadir en play
}


function stopAllAnimations(mixer) {
        if (!mixer) {
          console.warn("El modelo o el mixer aún no están listos");
          return;
        }
        mixer._actions.forEach((action) => {
          const clip = action.getClip();
          handleStopAnimation(action, clip); // Usa la lógica de rebobinado
          // O simplemente detenerlas: action.stop();
        });
        animacionActual = null; // Resetear la animación actual
      }

// Función para rebobinar (puede no ser necesaria si usas fadeOut/fadeIn)
function handleStopAnimation(animation, clip) {
        animation.reset();
        animation.clampWhenFinished = true;
        animation.setLoop(THREE.LoopOnce, 0); // Asegurar que no loopee al rebobinar
        animation.timeScale = -1; // Invertir dirección
        animation.paused = false; // Asegurar que no esté pausada
        // Establecer el tiempo al final solo si va hacia atrás
        if (animation.time === 0) { // Si ya estaba al principio, ponerla al final para rebobinar
             animation.time = clip.duration;
        }
        animation.play(); // Reproducir hacia atrás
        console.log(`[handleStopAnimation] Rebobinando animación: ${clip.name || 'Sin nombre'}`);
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
        const animIndex = parseInt(btn.dataset.panelAnimation, 10);

        if (isNaN(animIndex)) {
            console.warn(`[setupUIListeners] Botón FAB con data-panel-animation inválido, permanecerá deshabilitado:`, btn);
            btn.disabled = true; // Asegurar deshabilitado
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            return;
        }

        // Comprueba si la animación existe en el array cargado
        if (animations && animIndex >= 0 && animIndex < animations.length && animations[animIndex]) {
            // La animación EXISTE -> HABILITAR el botón
            // console.log(`[setupUIListeners] Habilitando botón FAB Anim ${animIndex}`); // Menos verboso
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';

            // Añadir el listener (limpiar antes por si acaso)
            // Usamos una función nombrada para poder removerla si es necesario después, aunque aquí no lo hacemos
            const fabClickHandler = () => {
                 console.log(`%c[FAB Click] Botón Animación ${animIndex} pulsado!`, 'color: blue; font-weight: bold;');
                  //mostramos el popup
                console.log("mostrando overlay");
                // Selección de elementos con las nuevas clases/IDs
                overlay   = document.getElementById('panelOverlay');
                closeBtn  = overlay.querySelector('.panel-close');
                imgEl     = overlay.querySelector('img');
                txtEl     = overlay.querySelector('p');
                isOpen = false;


                // cerrar al clickar la X o en el overlay
                closeBtn.addEventListener("click", closePopup);
                overlay.addEventListener("click", (e) => {
                if (e.target === overlay) closePopup();
                });

                const panel = contenidoJson.find((p) => p.animacion === animIndex);

                // si está abierto, ciérralo para reiniciar la animación CSS
                if (isOpen) {
                  closePopup();
                  // espera a que termine la transición antes de abrir de nuevo
                  overlay.addEventListener(
                    "transitionend",
                    () => openPopup(panel),
                    { once: true }
                  );
                } else {
                  openPopup(panel);
                }
   


                 if (carMesh && mixer) {
                     playCarAnimation(animIndex); // Llama a la función principal

                   



                 } else {
                      console.warn(`[FAB Click] No se puede reproducir Anim ${animIndex}: carMesh o mixer no listos.`);
                 }
            };
            // Limpiar listeners previos para evitar duplicados si este código se ejecuta más de una vez
            btn.removeEventListener('click', btn.__fabClickHandler__); // Remover handler anterior si existe
            btn.addEventListener('click', fabClickHandler);
            btn.__fabClickHandler__ = fabClickHandler; // Guardar referencia al handler en el botón

        } else {
            // La animación NO EXISTE -> DEJAR DESHABILITADO
            console.warn(`[setupUIListeners] Animación ${animIndex} no encontrada. Botón FAB permanecerá deshabilitado.`);
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    });

    // --- 2. Botón de Vista Interior del PANEL FAB ---
    // CORRECCIÓN: El data-panel-action debe ser "insideView", no "panelInsideBtn "
    const fabInsideSelector = '#panel-section-test .panel-button[data-panel-action="insideView"]';
    const panelInsideBtn = document.querySelector(fabInsideSelector);

    if (panelInsideBtn) {
        console.log(`[setupUIListeners] Habilitando botón FAB vista interior.`);
        panelInsideBtn.disabled = false;
        panelInsideBtn.style.opacity = '1';
        panelInsideBtn.style.cursor = 'pointer';

        const insideViewHandler = () => {
             console.log("%c[FAB Click] Botón Vista Interior pulsado!", 'color: purple; font-weight: bold;');
             if (carMesh && controls && camera) {
                 setInsideView();
             } else {
                 console.warn("[FAB Click] No se puede activar vista interior: faltan carMesh, controls o camera.");
             }
        };
        panelInsideBtn.removeEventListener('click', panelInsideBtn.__insideViewHandler__);
        panelInsideBtn.addEventListener('click', insideViewHandler);
        panelInsideBtn.__insideViewHandler__ = insideViewHandler;

    } else {
        console.warn("[setupUIListeners] Botón FAB vista interior ('[data-panel-action=\"insideView\"]') NO encontrado.");
    }

    console.log("[setupUIListeners] Configuración de listeners del FAB finalizada.");
}


/** Exportar a Draco */
function exportToDraco() {
    if (!carMesh) { console.warn("No hay modelo cargado para exportar."); return; }
    const exporter = new DRACOExporter();
    const options = { /* ... opciones ... */ };
    console.log("Iniciando exportación a Draco...");
    // ... (código de exportación) ...
    console.log("Exportación a Draco finalizada y descarga iniciada.");
}

function openPopup(data) {
        // rellena contenido
        //console.log(data.imagen);
        console.log("abriendo overlay");
        console.log(data.descripcion);
        imgEl.src = `${data.imagen}`;
        txtEl.textContent = data.descripcion;
        // abre overlay
        overlay.classList.add("open");
        isOpen = true;
      }

function closePopup() {
    console.log("cerrando overlayAAAAAAAAAAAAAA");
overlay.classList.remove("open");
isOpen = false;
}

/** Función principal de inicialización */
async function initCarExperience(threeElements, modelUrl, panelImageUrl) {
    scene = threeElements.scene;
    camera = threeElements.camera;
    controls = threeElements.controls;

    console.log("[initCarExperience] Iniciando...");
    if (!scene || !camera || !controls || !modelUrl) {
        throw new Error("[initCarExperience] Faltan elementos esenciales.");
    }
    try {
        console.log("[initCarExperience] Cargando modelo...");
        await loadCarModel(modelUrl, scene);
        console.log("[initCarExperience] Modelo cargado. Configurando listeners UI (FAB)...");
        setupUIListeners(camera, controls); // Configura listeners después de cargar el modelo y animaciones
        console.log("[initCarExperience] Inicialización completada exitosamente.");
    } catch (error) {
        console.error("[initCarExperience] Fallo CRÍTICO:", error);
        throw error; // Relanzar para que se maneje externamente si es necesario
    }
}


/** Función de actualización (bucle) */
function updateCarExperience(delta) {
    if (mixer) {
        mixer.update(delta); // Actualizar el mixer de animación si existe
    }
    // No es necesario actualizar controls aquí si OrbitControls está en threeSetup.js
}

// ---- NUEVA LÍNEA (AÑADIDA AL FINAL ANTES DEL EXPORT) ----
// Exponer playCarAnimation globalmente para que otros scripts (como chatIntegration) puedan llamarla
window.triggerCarAnimation = playCarAnimation;
console.log("[carExperience.js] Función 'triggerCarAnimation' expuesta globalmente.");
// ----------------------------------------------------------

// Exportar funciones públicas del módulo (si las hubiera para otros módulos ES6)
export { initCarExperience, updateCarExperience };