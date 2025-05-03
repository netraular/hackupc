import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOExporter } from 'three/addons/exporters/DRACOExporter.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Variables específicas de la experiencia
let carMesh = null;
let mixer = null;
let animations = [];
let panelGroup = null;
const textosInfoPanel = [ // Textos para el panel de información flotante
    "¡Hola!", "Explora el coche", "Detalles del modelo", "Interacción", "Bienvenido",
];

// Referencias a los elementos de Three.js (se inicializarán en initCarExperience)
let scene, camera, controls;

/**
 * Carga el modelo GLB del coche, lo añade a la escena y configura el mixer.
 * @param {string} modelUrl - URL del archivo GLB.
 * @param {THREE.Scene} targetScene - Escena donde añadir el modelo.
 * @returns {Promise<object>} - Promesa que resuelve con { mesh, mixer, animations }
 */
function loadCarModel(modelUrl, targetScene) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            modelUrl,
            (gltf) => {
                carMesh = gltf.scene; // Guarda la referencia al mesh principal
                scene = targetScene; // Guarda referencia a la escena

                // Configura sombras para todos los meshes dentro del modelo
                carMesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                carMesh.position.y = 0; // Ajusta la posición vertical si es necesario
                scene.add(carMesh);

                animations = gltf.animations || []; // Guarda las animaciones
                if (animations.length > 0) {
                    mixer = new THREE.AnimationMixer(carMesh); // Crea el mixer si hay animaciones
                } else {
                    mixer = null;
                    console.warn("Modelo cargado sin animaciones.");
                }


                console.log(`Modelo cargado: ${modelUrl}, ${animations.length} animaciones encontradas.`);
                resolve({ mesh: carMesh, mixer, animations }); // Resuelve la promesa con los datos
            },
            undefined, // Callback de progreso (opcional)
            (error) => {
                console.error('Error cargando el modelo GLB:', error);
                reject(error); // Rechaza la promesa en caso de error
            }
        );
    });
}

/**
 * Reproduce una animación específica por su índice.
 * @param {number} index - Índice de la animación en el array 'animations'.
 */
function playCarAnimation(index) {
    if (!mixer) {
        console.warn("Mixer no inicializado, no se puede reproducir animación.");
        return;
    }
    if (!animations[index]) {
        console.warn(`Animación con índice ${index} no encontrada.`);
        return;
    }

    const animation = animations[index];
    console.log(`Intentando reproducir animación: ${animation.name} (índice ${index})`);

    try {
        const action = mixer.clipAction(animation);
        if (!action) {
             console.error(`No se pudo crear la acción para la animación ${index}.`);
             return;
        }

        // Detener otras acciones para evitar solapamientos (opcional, depende del efecto deseado)
        // mixer.stopAllAction();

        // Configurar y reproducir la acción
        action.reset()
            .setLoop(THREE.LoopOnce, 1) // Reproducir una sola vez
            .clampWhenFinished = true; // Mantener el estado final
        action.play();

    } catch (error) {
        console.error(`Error al intentar reproducir animación ${index}:`, error);
    }
}

/**
 * Muestra un panel informativo flotante con texto aleatorio e imagen frente a la cámara.
 * @param {string} panelImageUrl - URL de la imagen a mostrar.
 * @param {THREE.Camera} currentCamera - Cámara actual para calcular la posición.
 */
function showInfoPanel(panelImageUrl, currentCamera) {
    if (!scene || !currentCamera) {
        console.warn("Escena o cámara no disponibles para mostrar el panel de información.");
        return;
    }
    camera = currentCamera; // Actualizar referencia

    // Eliminar panel anterior si existe (limpiando recursos)
    if (panelGroup) {
        scene.remove(panelGroup);
        panelGroup.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        });
        panelGroup = null; // Asegurarse de limpiar la referencia
    }

    panelGroup = new THREE.Group(); // Crear nuevo grupo para el panel

    // --- Crear Texto con Canvas ---
    const txt = textosInfoPanel[Math.floor(Math.random() * textosInfoPanel.length)];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const canvasWidth = 512, canvasHeight = 128;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.fillStyle = '#333'; // Fondo oscuro
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = 'white'; // Texto blanco
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, canvasWidth / 2, canvasHeight / 2);
    const textTexture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, side: THREE.DoubleSide });
    const textGeometry = new THREE.PlaneGeometry(2, 0.5); // Ajustar tamaño si es necesario
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.y = 0.7; // Posicionar texto encima de la imagen
    panelGroup.add(textMesh);

    // --- Cargar y añadir Imagen ---
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(panelImageUrl,
        (imgTexture) => { // Success Callback
            const imgAspect = imgTexture.image.width / imgTexture.image.height;
            const imgHeight = 1.5;
            const imgWidth = imgHeight * imgAspect;
            const imgGeometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
            const imgMaterial = new THREE.MeshBasicMaterial({ map: imgTexture, side: THREE.DoubleSide });
            const imgMesh = new THREE.Mesh(imgGeometry, imgMaterial);
            imgMesh.position.y = -0.3; // Posicionar imagen debajo del texto
            panelGroup.add(imgMesh);

            // Posicionar el grupo completo solo después de cargar la imagen
            positionAndAddPanel();
        },
        undefined, // Progress Callback (opcional)
        (err) => { // Error Callback
            console.error("Error cargando imagen del panel:", err);
            // Igualmente posicionar (mostrará solo el texto)
            positionAndAddPanel();
        }
    );

    // --- Función interna para posicionar el panel ---
    function positionAndAddPanel() {
        if (!panelGroup) return; // Seguridad
        const distance = 3; // Distancia del panel a la cámara
        const targetPosition = new THREE.Vector3();
        // Obtener la dirección en la que mira la cámara
        camera.getWorldDirection(targetPosition);
        // Mover el punto a 'distance' unidades en esa dirección desde la cámara
        targetPosition.multiplyScalar(distance).add(camera.position);

        panelGroup.position.copy(targetPosition);
        panelGroup.lookAt(camera.position); // Hacer que el panel mire siempre a la cámara
        scene.add(panelGroup);
        // console.log("Panel de información mostrado/actualizado."); // Puede ser útil para depurar
    }
}

/**
 * Cambia la cámara a una posición predefinida 'dentro' del coche.
 * @param {THREE.Camera} currentCamera - La cámara a mover.
 * @param {THREE.OrbitControls} currentControls - Los controles orbitales.
 * @param {THREE.Object3D} targetMesh - El mesh del coche (o un objeto de referencia).
 */
function setInsideView(currentCamera, currentControls, targetMesh) {
    if (!targetMesh || !currentControls || !currentCamera) {
        console.warn("Faltan elementos (cámara, controles o mesh) para la vista interior.");
        return;
    }
    // --- Define la posición y el punto de mira RELATIVOS al coche ---
    // Ajusta estos valores según tu modelo y el efecto deseado
    const insidePositionRelative = new THREE.Vector3(0.3, 1.1, -0.2); // Ejemplo: asiento del conductor
    const lookAtTargetRelative = new THREE.Vector3(0, 1, 5); // Ejemplo: mirar hacia adelante

    // Convertir coordenadas relativas a coordenadas del mundo
    const worldPosition = targetMesh.localToWorld(insidePositionRelative.clone());
    const worldTarget = targetMesh.localToWorld(lookAtTargetRelative.clone());

    // Mover la cámara y actualizar el objetivo de los controles
    currentCamera.position.copy(worldPosition);
    currentControls.target.copy(worldTarget);
    currentControls.update(); // ¡Importante! Aplica los cambios de target/position
    console.log("Cámara movida a vista interior.");
}

/**
 * Configura los listeners para TODOS los botones interactivos (originales y panel FAB).
 * @param {THREE.Camera} currentCamera - La cámara.
 * @param {THREE.OrbitControls} currentControls - Los controles orbitales.
 * @param {string} panelImageUrl - URL de la imagen para el panel de información.
 */
function setupUIListeners(currentCamera, currentControls, panelImageUrl) {
    // Guardar referencias globales para este módulo si es necesario
    // (ya deberían estar seteadas por initCarExperience)
    camera = currentCamera;
    controls = currentControls;

    // --- 1. Botones de Animación ORIGINALES (en .controls-container) ---
    document.querySelectorAll('.controls-container .animation').forEach(btn => {
        const animIndex = parseInt(btn.dataset.animation, 10);

        // Habilitar/Deshabilitar botón según si la animación existe
        if (animations && animations[animIndex]) {
            btn.disabled = false;
            btn.addEventListener('click', () => {
                if (carMesh) {
                    // showInfoPanel(panelImageUrl, currentCamera); // Opcional: mostrar panel de info
                    playCarAnimation(animIndex);
                } else {
                    console.warn("Botón animación original pulsado, pero carMesh no está listo.");
                }
            });
        } else {
            console.warn(`Animación original ${animIndex} no encontrada, botón deshabilitado.`);
            btn.disabled = true;
        }
    });

    // --- 2. Botón Vista Interior ORIGINAL (en .controls-container) ---
    const originalInsideBtn = document.getElementById('insideCameraBtn');
    if (originalInsideBtn) {
        originalInsideBtn.addEventListener('click', () => {
            setInsideView(currentCamera, currentControls, carMesh); // Llama a la función reutilizable
        });
    } else {
        console.warn("Botón original 'insideCameraBtn' no encontrado.");
    }

    // --- 3. Botones de Animación del PANEL FAB ---
    const fabAnimationButtons = document.querySelectorAll('#panel-section-test .panel-button[data-panel-animation]');
    fabAnimationButtons.forEach(btn => {
        const animIndex = parseInt(btn.dataset.panelAnimation, 10);

        // Habilitar/Deshabilitar según existencia de animación
        if (animations && animations[animIndex]) {
            btn.disabled = false; // Asegurarse que no esté deshabilitado por defecto
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';

            btn.addEventListener('click', () => {
                if (carMesh) {
                    showInfoPanel(panelImageUrl, currentCamera); // Mostrar panel de info también
                    playCarAnimation(animIndex);
                    // Opcional: Cerrar el panel FAB después de la acción
                    // document.getElementById('fab-action-panel')?.classList.remove('active');
                    // const fabButtonIcon = document.querySelector('#fab-toggle-button i');
                    // if(fabButtonIcon) {
                    //     fabButtonIcon.classList.remove('fa-times');
                    //     fabButtonIcon.classList.add('fa-plus');
                    // }
                } else {
                    console.warn(`Botón animación panel (${animIndex}) pulsado, pero carMesh no está listo.`);
                }
            });
        } else {
            console.warn(`Animación ${animIndex} no encontrada para el botón del panel.`);
            btn.disabled = true; // Deshabilitar si no existe
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
        }
    });

    // --- 4. Botón de Vista Interior del PANEL FAB ---
    const panelInsideBtn = document.querySelector('#panel-section-test .panel-button[data-panel-action="insideView"]');
    if (panelInsideBtn) {
        panelInsideBtn.addEventListener('click', () => {
            setInsideView(currentCamera, currentControls, carMesh); // Llama a la función reutilizable
             // Opcional: Cerrar el panel FAB después de la acción
             // document.getElementById('fab-action-panel')?.classList.remove('active');
             // const fabButtonIcon = document.querySelector('#fab-toggle-button i');
             // if(fabButtonIcon) {
             //     fabButtonIcon.classList.remove('fa-times');
             //     fabButtonIcon.classList.add('fa-plus');
             // }
        });
    } else {
        console.warn("Botón de vista interior del panel no encontrado (selector: #panel-section-test .panel-button[data-panel-action='insideView']).");
    }

    console.log("Listeners de UI (originales y panel FAB) configurados/actualizados.");
}

/** Función para exportar el modelo cargado a formato Draco (.drc) */
function exportToDraco() {
    if (!carMesh) {
        alert("El modelo no está cargado para exportar.");
        console.warn("Intento de exportar sin modelo cargado.");
        return;
    }

    const exporter = new DRACOExporter();
    const link = document.createElement('a'); // Enlace temporal para descarga
    link.style.display = 'none';
    document.body.appendChild(link); // Necesario para poder simular el clic

    // Función auxiliar para guardar ArrayBuffer
    function saveArrayBuffer(buffer, filename) {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click(); // Simula clic para descargar
        URL.revokeObjectURL(link.href); // Libera memoria
    }

    try {
        console.log("Iniciando exportación a Draco...");
        const options = {
            dracoOptions: { compressionLevel: 5 } // Ajusta nivel de compresión (0-10)
        };
        const result = exporter.parse(carMesh, options); // Exporta el mesh cargado
        if (result) {
            saveArrayBuffer(result, 'car_model_exported.drc'); // Nombre del archivo descargado
            console.log("Exportación a Draco completada.");
        } else {
            throw new Error("La exportación no produjo resultados.");
        }
    } catch (error) {
        console.error("Error durante la exportación a Draco:", error);
        alert("Error al exportar el modelo: " + error.message);
    } finally {
        document.body.removeChild(link); // Elimina el enlace temporal del DOM
    }
}

/** Configura y muestra el panel de GUI (lil-gui) para la exportación */
function setupGUI() {
    // Evitar crear múltiples GUIs si se llama varias veces
    if (document.querySelector('.lil-gui')) {
        return;
    }
    const gui = new GUI();
    const params = {
        export: exportToDraco // Llama a la función de exportación al hacer clic
    };
    gui.add(params, 'export').name('Exportar DRC');
    console.log("Panel lil-gui configurado.");
    // gui.open(); // Descomentar si quieres que el panel GUI esté abierto por defecto
}


/**
 * Función principal de inicialización para la experiencia del coche.
 * Carga el modelo, configura listeners y GUI.
 * @param {object} threeElements - Objeto con { scene, camera, controls } de initThree.
 * @param {string} modelUrl - URL del modelo GLB.
 * @param {string} panelImageUrl - URL de la imagen del panel informativo.
 */
async function initCarExperience(threeElements, modelUrl, panelImageUrl) {
    // Guarda las referencias de Three.js necesarias para este módulo
    scene = threeElements.scene;
    camera = threeElements.camera;
    controls = threeElements.controls;

    console.log("Iniciando carga de la experiencia del coche...");

    try {
        // Carga el modelo y espera a que termine
        const { mesh, mixer: loadedMixer, animations: loadedAnimations } = await loadCarModel(modelUrl, scene);
        // Las variables carMesh, mixer, animations ya se actualizaron dentro de loadCarModel

        // Configura los listeners de la UI AHORA que el modelo (y sus animaciones) están cargados
        setupUIListeners(camera, controls, panelImageUrl);

        // Configura el panel de GUI para exportar
        setupGUI();

        console.log("Experiencia del coche inicializada correctamente.");

    } catch (error) {
        console.error("Fallo CRÍTICO al inicializar la experiencia del coche:", error);
        // Aquí podrías mostrar un mensaje de error más visible al usuario en la propia página
        const errorDiv = document.body.querySelector('#init-error-msg');
        if (errorDiv) {
             errorDiv.textContent = "Error al cargar el modelo 3D.";
             errorDiv.style.display = 'block';
        }
    }
}

/**
 * Función de actualización que se llama en cada frame del bucle de animación.
 * @param {number} delta - Tiempo (en segundos) transcurrido desde el último frame.
 */
function updateCarExperience(delta) {
    // Actualizar el mixer de animación es lo más importante aquí
    if (mixer) {
        mixer.update(delta); // Avanza las animaciones
    }

    // Aquí podrías añadir otras lógicas que necesiten actualizarse en cada frame,
    // como la lógica de un juego, físicas simples, etc.
}


// Exporta las funciones que necesitan ser llamadas desde fuera de este módulo
// (principalmente desde el script orquestador en web.blade.php)
export { initCarExperience, updateCarExperience };