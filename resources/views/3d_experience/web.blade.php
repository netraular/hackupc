<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"> {{-- Cambiado a lang de Laravel --}}

<head>
    <title>MODEL 3D</title>
    <meta charset="utf-8" />
    <meta
        name="viewport"
        content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    {{-- Asegúrate que la ruta a main.css sea correcta desde la carpeta public --}}
    {{-- Si '3dmodel' está dentro de 'public', está bien. Si no, usa asset() --}}
    <link type="text/css" rel="stylesheet" href="{{ asset('3dmodel/css/main.css') }}" />

    {{-- Estilos para el Popup (añadido) --}}
    <style>
        /* Overlay: cubre todo y centra contenido con Flexbox */
        .popup-overlay {
            position: fixed;
            /* Fijo en la pantalla */
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            /* Fondo más oscuro */
            z-index: 1000;
            display: flex;
            /* Habilita Flexbox */
            justify-content: center;
            /* Centra horizontalmente */
            align-items: center;
            /* Centra verticalmente */
            /* Inicialmente oculto (el JS lo mostrará cambiando display a 'flex') */
            display: none;
            padding: 20px;
            /* Espacio por si el popup es muy grande */
            box-sizing: border-box;
        }

        /* Contenido del Popup */
        .popup-content {
            background-color: #fff;
            padding: 25px 30px;
            /* Ajusta padding */
            border-radius: 10px;
            /* Bordes más redondeados */
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.25);
            max-width: 550px;
            /* Un poco más ancho */
            width: 95%;
            /* Más responsivo */
            position: relative;
            text-align: left;
            color: #333;
            max-height: 90vh;
            /* Altura máxima para evitar desbordamiento */
            overflow-y: auto;
            /* Scroll si el contenido es muy largo */
        }

        .popup-content h2 {
            margin-top: 0;
            margin-bottom: 20px;
            /* Más espacio debajo del título */
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            text-align: center;
            /* Centrar título */
        }

        /* Botón de cerrar */
        .close-button {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 28px;
            /* Más grande */
            font-weight: bold;
            color: #aaa;
            /* Más suave */
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }

        .close-button:hover {
            color: #333;
        }

        /* Contenedor de todos los miembros */
        .team-members {
            display: flex;
            flex-direction: column;
            /* Apila los miembros verticalmente */
            gap: 20px;
            /* Espacio entre miembros */
        }

        /* Estilo para cada bloque de miembro */
        .member-info {
            display: flex;
            /* Imagen y texto en línea */
            align-items: center;
            /* Centra verticalmente imagen y texto */
            gap: 15px;
            /* Espacio entre imagen y texto */
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
            /* Separador suave */
        }

        .member-info:last-child {
            border-bottom: none;
            /* No poner borde al último */
        }

        /* Estilo para la imagen de GitHub */
        .github-avatar {
            width: 60px;
            /* Tamaño fijo */
            height: 60px;
            border-radius: 50%;
            /* Hace la imagen redonda */
            object-fit: cover;
            /* Evita que la imagen se deforme */
            border: 2px solid #eee;
            /* Borde sutil */
        }

        /* Contenedor para nombre y enlace */
        .member-details {
            flex-grow: 1;
            /* Ocupa el espacio restante */
        }

        /* Estilo para el nombre del miembro */
        .member-name {
            font-weight: bold;
            margin: 0 0 5px 0;
            /* Sin margen superior, poco inferior */
            font-size: 1.1em;
            color: #444;
        }

        /* Estilo para el enlace web */
        .member-website {
            color: #007bff;
            text-decoration: none;
            font-size: 0.9em;
        }

        .member-website:hover {
            text-decoration: underline;
        }

        /* Estilo del botón "Sobre Nosotros" (igual que antes) */
        #about-us-button {
            padding: 8px 15px;
            cursor: pointer;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 5px;
            margin: 5px;
            font-size: 14px;
        }

        #about-us-button:hover {
            background-color: #5a6268;
        }
    </style>
</head>

<body>
    {{-- Botones existentes --}}
    <button class="animation" data-animation="0" disabled>animation 1</button>
    <button class="animation" data-animation="1" disabled>animation 2</button>
    <button class="animation" data-animation="2" disabled>animation 3</button>
    <button class="animation" data-animation="3" disabled>animation 4</button>
    <button class="animation" data-animation="4" disabled>animation 5</button>

    {{-- Botón añadido para el Popup About Us --}}
    <button id="about-us-button">Sobre Nosotros</button>

    <div id="info">
        <button id="insideCameraBtn">Inside Camera View</button>
    </div>

    <script type="importmap">
        {
        "imports": {
          "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
          "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
      }
    </script>

    {{-- Script Module de Three.js (sin cambios internos) --}}
    <script type="module">
        import * as THREE from "three";
        import {
            OrbitControls
        } from "three/addons/controls/OrbitControls.js";
        import {
            DRACOExporter
        } from "three/addons/exporters/DRACOExporter.js";
        import {
            GUI
        } from "three/addons/libs/lil-gui.module.min.js";
        import {
            GLTFLoader
        } from "three/addons/loaders/GLTFLoader.js";

        let scene, camera, renderer, exporter, mesh;
        let mixer = null; // Inicializar a null
        let controls;
        let action = null;
        let clip = null;
        let panelGroup = null;
        let loadedGltf = null; // Variable para guardar el gltf cargado

        const textos = [
            "¡Hola Mundo!",
            "Tu carrito te saluda",
            "Texto sorpresa",
            "¡Bienvenido!",
            "Este es tu carrito",
        ];

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

        const params = {
            export: exportFile,
        };

        init();

        function init() {
            camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                0.1,
                100
            );
            camera.position.set(4, 2, 4);

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xa0a0a0);
            scene.fog = new THREE.Fog(0xa0a0a0, 4, 20);

            exporter = new DRACOExporter();

            // Lights
            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
            hemiLight.position.set(0, 20, 0);
            scene.add(hemiLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
            directionalLight.position.set(0, 20, 10);
            directionalLight.castShadow = true;
            directionalLight.shadow.camera.top = 2;
            directionalLight.shadow.camera.bottom = -2;
            directionalLight.shadow.camera.left = -2;
            directionalLight.shadow.camera.right = 2;
            scene.add(directionalLight);

            // Ground
            const ground = new THREE.Mesh(
                new THREE.PlaneGeometry(40, 40),
                new THREE.MeshPhongMaterial({
                    color: 0xbbbbbb,
                    depthWrite: false
                })
            );
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            scene.add(ground);

            const grid = new THREE.GridHelper(40, 20, 0x000000, 0x000000);
            grid.material.opacity = 0.2;
            grid.material.transparent = true;
            scene.add(grid);

            // NO NECESITAS ESTA FUNCION AQUI SI NO CREAS BOTONES 3D DINÁMICAMENTE
            // function createButton(label, animationIndex, positionVector3) { ... }
            // const buttons = []; // Tampoco necesitas esto si no usas createButton

            // Load GLB model
            const loader = new GLTFLoader();
            // Asegúrate que la ruta al GLB sea correcta desde la carpeta public
            loader.load(
                "{{ asset('3dmodel/oficial.glb') }}", // Recomendado usar asset()
                function(gltf) { // No reasignar gltf globalmente aquí, usar el parámetro
                    loadedGltf = gltf; // Guarda el gltf cargado
                    mesh = gltf.scene;
                    mesh.traverse(function(child) {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    mesh.position.y = 0; // Ajusta si es necesario
                    scene.add(mesh);

                    mixer = new THREE.AnimationMixer(mesh); // Crear el mixer aquí

                    // Habilitar botones y añadir listeners
                    document.querySelectorAll(".animation").forEach((btn) => {
                        btn.disabled = false;
                        btn.addEventListener("click", () => {
                            const idx = parseInt(btn.dataset.animation, 10);
                            if (loadedGltf && loadedGltf.animations && loadedGltf.animations[idx]) {
                                showPanelRandom(); // Muestra el panel
                                // Llama a doAnimation con el mixer y la animación correcta
                                doAnimation(idx, loadedGltf.animations[idx], mixer);
                            } else {
                                console.warn(`Animación con índice ${idx} no encontrada.`);
                            }
                        });
                    });
                },
                undefined, // Progress callback (opcional)
                function(error) {
                    console.error("Error al cargar el modelo GLB:", error);
                }
            );

            // Renderer
            renderer = new THREE.WebGLRenderer({
                antialias: true
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setAnimationLoop(animate); // Usa setAnimationLoop para el bucle de renderizado
            renderer.shadowMap.enabled = true;
            document.body.appendChild(renderer.domElement);

            // Controls
            controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(0, 1, 0); // Ajusta el target si es necesario
            controls.update();

            // Resize
            window.addEventListener("resize", onWindowResize);

            // Inside Camera Button event
            document
                .getElementById("insideCameraBtn")
                .addEventListener("click", () => {
                    if (!mesh) {
                        console.warn("Modelo aún no cargado para la vista interior."); // Cambiado a warn
                        return;
                    }
                    const fixedPosition = new THREE.Vector3(0.3, 1.2, -0.5); // Ajusta esta posición
                    camera.position.copy(fixedPosition);
                    controls.target.set(0, 1, 2); // Ajusta hacia donde mira (adelante)
                    controls.update();
                    camera.lookAt(controls.target); // Asegúrate que mire al target
                });

            // GUI
            const gui = new GUI();
            gui.add(params, "export").name("Exportar DRC");
            // gui.open(); // No es necesario si solo tiene un botón
        }

        function showPanelRandom() {
            if (panelGroup) scene.remove(panelGroup); // Eliminar panel anterior
            panelGroup = new THREE.Group();

            // Texto random
            const txt = textos[Math.floor(Math.random() * textos.length)];
            const CW = 512,
                CH = 128;
            const cvs = document.createElement("canvas");
            cvs.width = CW;
            cvs.height = CH;
            const ctx = cvs.getContext("2d");
            ctx.fillStyle = "#222";
            ctx.fillRect(0, 0, CW, CH);
            ctx.font = "48px sans-serif";
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(txt, CW / 2, CH / 2);
            const txtTex = new THREE.CanvasTexture(cvs);
            const txtMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 0.5),
                new THREE.MeshBasicMaterial({
                    map: txtTex,
                    transparent: true
                })
            );
            panelGroup.add(txtMesh);

            // Imagen (Asegúrate que la ruta sea correcta desde public)
            new THREE.TextureLoader().load("{{ asset('3dmodel/imgs/carrito.jpg') }}", (imgTex) => { // Usar asset()
                const ar = imgTex.image.width / imgTex.image.height;
                const imgMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(1.5 * ar, 1.5),
                    new THREE.MeshBasicMaterial({
                        map: imgTex
                    })
                );
                imgMesh.position.y = -1.0; // Ajustado para que no solape tanto con el texto
                panelGroup.add(imgMesh);
            });

            // Colocar frente a cámara dinámicamente
            const distance = 3; // Distancia desde la cámara
            const targetPosition = new THREE.Vector3();
            camera.getWorldDirection(targetPosition); // Obtener dirección de la cámara
            targetPosition.multiplyScalar(distance); // Mover en esa dirección
            targetPosition.add(camera.position); // Sumar posición actual de la cámara

            panelGroup.position.copy(targetPosition);
            panelGroup.lookAt(camera.position); // Hacer que el panel mire a la cámara
            scene.add(panelGroup);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        const clock = new THREE.Clock(); // Necesitas un Clock para el delta time del mixer

        function animate() {
            // requestAnimationFrame(animate); // No necesitas esto si usas renderer.setAnimationLoop

            const delta = clock.getDelta(); // Obtener tiempo desde el último frame
            if (mixer) {
                mixer.update(delta); // Actualizar el mixer con delta time
            }

            // Actualizar controles si es necesario (ej. enableDamping)
            // controls.update();

            renderer.render(scene, camera);
        }

        // --- Funciones de Exportación y Guardado (sin cambios) ---
        function exportFile() {
            if (!mesh) {
                alert("Modelo aún no cargado");
                return;
            }
            // Asegúrate que DRACOExporter esté correctamente importado y funcional
            try {
                const result = exporter.parse(mesh, {
                    dracoOptions: {
                        compressionLevel: 5 // Puedes ajustar el nivel de compresión
                    }
                });
                saveArrayBuffer(result, "car.drc");
            } catch (error) {
                console.error("Error durante la exportación a Draco:", error);
                alert("Error al exportar el modelo.");
            }

        }

        const link = document.createElement("a");
        link.style.display = "none";
        document.body.appendChild(link);

        function save(blob, filename) {
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href); // Liberar memoria
        }

        function saveArrayBuffer(buffer, filename) {
            save(
                new Blob([buffer], {
                    type: "application/octet-stream"
                }),
                filename
            );
        }
    </script>

    {{-- Estructura del Popup (Modificada) --}}
    <div id="about-us-popup" class="popup-overlay"> {{-- Mantiene la clase para JS y centrado --}}
        <div class="popup-content">
            <button id="close-popup-button" class="close-button" aria-label="Cerrar">×</button>
            <h2>About us</h2>

            {{-- Contenedor para los miembros --}}
            <div class="team-members">

                {{-- Miembro 1 (Raúl) --}}
                <div class="member-info">
                    <img src="https://github.com/netraular.png" alt="Avatar de Raúl Aquilué Rubio" class="github-avatar">
                    <div class="member-details">
                        <p class="member-name">Raúl Aquilué Rubio</p>
                        <a href="https://raular.com" target="_blank" rel="noopener noreferrer" class="member-website">Portfolio</a>
                    </div>
                </div>

                {{-- Miembro 2 (Placeholder) --}}
                <div class="member-info">
                    <img src="https://github.com/github.png" alt="Avatar de Alexis Gabriel Diaz Fajardo" class="github-avatar"> {{-- Cambia github por el user --}}
                    <div class="member-details">
                        <p class="member-name">Alexis Gabriel Diaz Fajardo</p>
                        <a href="#" target="_blank" rel="noopener noreferrer" class="member-website">Sitio Web</a> {{-- Cambia # por la URL --}}
                    </div>
                </div>

                {{-- Miembro 3 (Placeholder) --}}
                <div class="member-info">
                    <img src="https://github.com/github.png" alt="Avatar de Nombre Integrante 3" class="github-avatar"> {{-- Cambia github por el user --}}
                    <div class="member-details">
                        <p class="member-name">Nombre Integrante 3</p>
                        <a href="#" target="_blank" rel="noopener noreferrer" class="member-website">Sitio Web</a> {{-- Cambia # por la URL --}}
                    </div>
                </div>

                {{-- Miembro 4 (Placeholder) --}}
                <div class="member-info">
                    <img src="https://github.com/github.png" alt="Avatar de Nombre Integrante 4" class="github-avatar"> {{-- Cambia github por el user --}}
                    <div class="member-details">
                        <p class="member-name">Nombre Integrante 4</p>
                        <a href="#" target="_blank" rel="noopener noreferrer" class="member-website">Sitio Web</a> {{-- Cambia # por la URL --}}
                    </div>
                </div>

            </div> {{-- Fin de .team-members --}}

        </div> {{-- Fin de .popup-content --}}
    </div> {{-- Fin de #about-us-popup --}}

    {{-- >>> INCLUIR EL SCRIPT DEL POPUP AQUÍ <<< --}}
    <script src="{{ asset('js/3d_experience/about-popup.js') }}"></script>

</body>

</html>