import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, clock;

/**
 * Inicializa los componentes básicos de Three.js.
 * @param {HTMLElement} container - Elemento DOM donde se añadirá el canvas.
 * @returns {object} - { scene, camera, renderer, controls, clock }
 */
function initThree(container) {
    clock = new THREE.Clock();

    // Cámara
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(4, 2, 4);

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 4, 20);

    // Luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(0, 20, 10);
    dirLight.castShadow = true;
    // Ajustar sombras si es necesario
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.top = 4; // Aumentar área de sombra si es necesario
    dirLight.shadow.camera.bottom = -4;
    dirLight.shadow.camera.left = -4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    scene.add(dirLight);
    // scene.add(new THREE.CameraHelper(dirLight.shadow.camera)); // Helper para debug de sombras

    // Suelo
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshPhongMaterial({ color: 0xbbbbbb, depthWrite: false })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid Helper
    const grid = new THREE.GridHelper(40, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras más suaves
    container.appendChild(renderer.domElement);

    // Controles
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0); // Ajusta el punto al que mira la cámara inicialmente
    controls.enableDamping = true; // Movimiento más suave
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Evita que el paneo cambie la altura
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Limitar ángulo vertical
    controls.update();

    // Listener para redimensionar
    window.addEventListener('resize', onWindowResize);

    console.log("Three.js setup complete.");
    return { scene, camera, renderer, controls, clock };
}

/** Manejador de redimensionamiento de ventana */
function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Inicia el bucle de animación/renderizado.
 * @param {function} updateCallback - Función que se llamará en cada frame (recibe delta time).
 */
function startAnimationLoop(updateCallback) {
    if (!renderer) {
        console.error("Renderer no inicializado para iniciar el bucle.");
        return;
    }
    renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();

        // Llama a la función de actualización externa (ej: mixer.update)
        if (updateCallback) {
            updateCallback(delta);
        }

        // Actualiza los controles si tienen damping
        if (controls && controls.enableDamping) {
            controls.update();
        }

        // Renderiza la escena
        renderer.render(scene, camera);
    });
    console.log("Animation loop started.");
}

// Exporta las funciones necesarias
export { initThree, startAnimationLoop };