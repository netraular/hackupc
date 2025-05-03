<!DOCTYPE html>
<html lang="en">

<head>
    <title>MODEL 3D</title>
    <meta charset="utf-8" />
    <meta
        name="viewport"
        content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <link type="text/css" rel="stylesheet" href="3dmodel/css/main.css" />
</head>

<body>
    <button class="animation" data-animation="0" disabled>animation 1</button>
    <button class="animation" data-animation="1" disabled>animation 2</button>
    <button class="animation" data-animation="2" disabled>animation 3</button>
    <button class="animation" data-animation="3" disabled>animation 4</button>
    <button class="animation" data-animation="4" disabled>animation 5</button>

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
        let mixer = "";
        let controls;
        let action = null;
        let clip = null;
        let panelGroup = null; // aquí guardaremos el panel para quitarlo si queremos

        // Textos random
        const textos = [
            "¡Hola Mundo!",
            "Tu carrito te saluda",
            "Texto sorpresa",
            "¡Bienvenido!",
            "Este es tu carrito",
        ];

        //para las animaciones
        let gltf = null;

        // 1) Defino la función globalmente
        function doAnimation(indexAnimation, animation, mixer) {
            if (!mixer) {
                console.warn("El modelo o el mixer aún no están listos");
                return;
            }
            const action = mixer.clipAction(animation);
            action.reset();
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.zeroSlopeAtEnd = true;
            action.timeScale = 5;
            action.play();
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
            camera.position.set(4, 2, 4); // Initial camera position

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

            // 1) Función para crear un botón 3D con texto dinámico
            function createButton(label, animationIndex, positionVector3) {
                const W = 256,
                    H = 128;
                const canvas = document.createElement("canvas");
                canvas.width = W;
                canvas.height = H;
                const ctx = canvas.getContext("2d");
                // fondo
                ctx.fillStyle = "#222";
                ctx.fillRect(0, 0, W, H);
                // texto
                ctx.font = "36px sans-serif";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, W / 2, H / 2);

                const tex = new THREE.CanvasTexture(canvas);
                const mat = new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                });
                const geo = new THREE.PlaneGeometry(1, 0.5);
                const btn = new THREE.Mesh(geo, mat);

                btn.position.copy(positionVector3);
                btn.userData.animationIndex = animationIndex; // índice a lanzar
                scene.add(btn);
                buttons.push(btn);

                return btn;
            }

            // Load GLB model
            const loader = new GLTFLoader();
            loader.load(
                "3dmodel/oficial.glb", // Replace with your GLB model path
                function(gltf) {
                    gltf = gltf;
                    mesh = gltf.scene;
                    mesh.traverse(function(child) {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    mesh.position.y = 0;
                    scene.add(mesh);

                    mixer = new THREE.AnimationMixer(mesh);

                    //add the listeners to the buttons
                    document.querySelectorAll(".animation").forEach((btn) => {
                        btn.disabled = false;
                        // Añadimos el listener que lee el índice del data-index
                        btn.addEventListener("click", () => {
                            const idx = parseInt(btn.dataset.animation, 10);
                            //index animation, animation, mixer
                            showPanelRandom();

                            doAnimation(idx, gltf.animations[idx], mixer);
                        });
                    });
                },
                undefined,
                function(error) {
                    console.error("Error al cargar car.glb:", error);
                }
            );

            // Renderer
            renderer = new THREE.WebGLRenderer({
                antialias: true
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setAnimationLoop(animate);
            renderer.shadowMap.enabled = true;
            document.body.appendChild(renderer.domElement);

            // Controls
            controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(0, 1.5, 0);
            controls.update();

            // Resize
            window.addEventListener("resize", onWindowResize);

            // Inside Camera Button event
            document
                .getElementById("insideCameraBtn")
                .addEventListener("click", () => {
                    if (!mesh) {
                        alert("Modelo aún no cargado");
                        return;
                    }

                    // Set a fixed position for the camera, inside the car
                    const fixedPosition = new THREE.Vector3(1.5, 0.9, 0.4); // Adjust the position to inside the car (90 degrees to the right)

                    // Set the camera position to this fixed position
                    camera.position.copy(fixedPosition);

                    // Ensure the camera is facing the model (you can adjust the rotation as necessary)
                    camera.lookAt(new THREE.Vector3(0, 0, 0)); // Adjust based on your model's front

                    // Update controls to target the center of the model (or another point you prefer)
                    controls.target.set(0, 0.7, 0.35); // Adjust this to the center of your model
                    controls.update();
                });

            // GUI
            const gui = new GUI();
            gui.add(params, "export").name("Exportar DRC");
            gui.open();
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

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            if (mixer) {
                mixer.update(0.01);
            }

            renderer.render(scene, camera);
            //   console.log('Camera Position and Center of Rotation:', {
            //   cameraPosition: camera.position,
            //   centerOfRotation: controls.target
            // });
        }

        function exportFile() {
            if (!mesh) {
                alert("Modelo aún no cargado");
                return;
            }
            const result = exporter.parse(mesh);
            saveArrayBuffer(result, "car.drc");
        }

        const link = document.createElement("a");
        link.style.display = "none";
        document.body.appendChild(link);

        function save(blob, filename) {
            link.href = URL.createObjectURL(blob);
            link.download = filename;
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