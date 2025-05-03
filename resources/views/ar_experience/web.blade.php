<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="utf-8" />
    <title>three.js webgl – animación y panel</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="main.css" />
    <style>
        body {
            margin: 0;
            overflow: hidden;
        }

        canvas {
            display: block;
        }
    </style>
</head>

<body>
    <!-- Botones HTML básicos -->
    <button class="animation" data-animation="0" disabled>Animación 1</button>
    <button class="animation" data-animation="1" disabled>Animación 2</button>
    <button class="animation" data-animation="2" disabled>Animación 3</button>
    <button class="animation" data-animation="3" disabled>Animación 4</button>
    <button class="animation" data-animation="4" disabled>Animación 5</button>

    <div id="info">
        <button id="insideCameraBtn">Inside Camera View</button>
        <a href="https://threejs.org" target="_blank" rel="noopener">three.js</a>
        webgl – cargar GLB + panel
    </div>

    <script type="importmap">
        {
        "imports": {
          "three": "https://unpkg.com/three@0.160.0/build/three.module.j,
          "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
      }
    </script>

    <script type="module">
        import * as THREE from "three";
        import {
            OrbitControls
        } from "three/addons/controls/OrbitControls.js";
        import {
            GLTFLoader
        } from "three/addons/loaders/GLTFLoader.js";
        import {
            DRACOExporter
        } from "three/addons/exporters/DRACOExporter.js";
        import {
            GUI
        } from "three/addons/libs/lil-gui.module.min.js";

        let scene, camera, renderer, controls, mixer, gltfData;
        let panelGroup = null;
        const clock = new THREE.Clock();
        const buttons3D = [];

        // Textos random para el panel
        const textos = [
            "¡Hola Mundo!",
            "Tu carrito te saluda",
            "Texto sorpresa",
            "¡Bienvenido!",
            "Este es tu carrito",
        ];

        init();
        animate();

        function init() {
            // Cámara y escena
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xa0a0a0);
            camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                0.1,
                100
            );
            camera.position.set(4, 2, 4);

            // Iluminación
            const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
            hemi.position.set(0, 20, 0);
            scene.add(hemi);
            const dir = new THREE.DirectionalLight(0xffffff, 2);
            dir.position.set(0, 20, 10);
            dir.castShadow = true;
            scene.add(dir);

            // Suelo
            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(40, 40),
                new THREE.MeshPhongMaterial({
                    color: 0x999999,
                    depthWrite: false
                })
            );
            floor.rotation.x = -Math.PI / 2;
            floor.receiveShadow = true;
            scene.add(floor);

            // Renderer
            renderer = new THREE.WebGLRenderer({
                antialias: true
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            document.body.appendChild(renderer.domElement);

            // Controles Orbit
            controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(0, 1, 0);
            controls.update();

            window.addEventListener("resize", onResize);
            renderer.domElement.addEventListener("pointerdown", onPointerDown);

            // Carga GLB
            const loader = new GLTFLoader();
            loader.load(
                "3dmodel/oficial.glb",
                (g) => {
                    gltfData = g;
                    const mesh = g.scene;
                    mesh.traverse(
                        (c) => c.isMesh && (c.castShadow = c.receiveShadow = true)
                    );
                    scene.add(mesh);
                    mixer = new THREE.AnimationMixer(mesh);

                    // habilitar botones HTML y asignar listeners
                    document.querySelectorAll(".animation").forEach((btn) => {
                        btn.disabled = false;
                        btn.addEventListener("click", () => {
                            const idx = parseInt(btn.dataset.animation, 10);
                            const clip = gltfData.animations[idx];

                            showPanelRandom();
                            playAnimation(clip);
                        });
                    });
                },
                undefined,
                (err) => console.error(err)
            );

            // GUI export DRC
            const exporter = new DRACOExporter();
            const gui = new GUI();
            gui
                .add({
                        export: () => {
                            if (!gltfData) return alert("Modelo no cargado");
                            const drc = exporter.parse(gltfData.scene);
                            saveArrayBuffer(drc, "car.drc");
                        },
                    },
                    "export"
                )
                .name("Exportar DRC");
        }

        function onPointerDown(event) {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            const hit = raycaster.intersectObjects(buttons3D, false);
            if (hit.length) {
                const idx = hit[0].object.userData.animationIndex;
                playAnimation(idx);
            }
        }

        // Muestra un panel 3D con texto e imagen
        function showPanelRandom() {
            // eliminar panel anterior
            if (panelGroup) scene.remove(panelGroup);
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

            // Imagen
            new THREE.TextureLoader().load("3dmodel/imgs/carrito.jpg", (imgTex) => {
                const ar = imgTex.image.width / imgTex.image.height;
                const imgMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(1.5 * ar, 1.5),
                    new THREE.MeshBasicMaterial({
                        map: imgTex
                    })
                );
                imgMesh.position.y = -0.75;
                panelGroup.add(imgMesh);
            });

            // Colocar frente a cámara
            panelGroup.position.set(0, 1.5, -2);
            scene.add(panelGroup);
        }

        function playAnimation(clip) {
            const action = mixer.clipAction(clip);
            action.reset();
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.zeroSlopeAtEnd = true;
            action.timeScale = 3;
            action.play();
        }

        function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            if (mixer) mixer.update(delta);
            // orientar panel y botones 3D (si los tuvieras)
            if (panelGroup) panelGroup.lookAt(camera.position);
            renderer.render(scene, camera);
        }

        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // Helpers para descarga
        const link = document.createElement("a");
        link.style.display = "none";
        document.body.appendChild(link);

        function save(blob, name) {
            link.href = URL.createObjectURL(blob);
            link.download = name;
            link.click();
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
</body>

</html>