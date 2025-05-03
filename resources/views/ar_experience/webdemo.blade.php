<!DOCTYPE html>
<html lang="en">
  <head>
    <title>three.js webgl - exporter - draco - cargar GLB</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0"
    />
  </head>
  <body>
    <button id="animacion1">animation 1</button>
    <div id="info">
      <a href="https://threejs.org" target="_blank" rel="noopener">three.js</a>
      webgl - exporter - draco - cargar GLB
    </div>

    <!-- Import maps polyfill -->
    <script async src="https://unpkg.com/es-module-shims@1.6.3/dist/es-module-shims.js"></script>
    
    <script type="importmap">
      {
        "imports": {
          "three": "https://unpkg.com/three@0.176.0/build/three.module.js",
          "three/addons/": "https://unpkg.com/three@0.176.0/examples/jsm/"
        }
      }
    </script>

    <script type="module">
      import * as THREE from "three";
      import { OrbitControls } from "three/addons/controls/OrbitControls.js";
      import { GUI } from "three/addons/libs/lil-gui.module.min.js";
      import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

      let scene, camera, renderer, exporter, mesh;
      let mixer = "";
      let action = "";
      let clip = "";

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

        // Luces
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

        // Suelo
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 40),
          new THREE.MeshPhongMaterial({ color: 0xbbbbbb, depthWrite: false })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        const grid = new THREE.GridHelper(40, 20, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        scene.add(grid);

        // Cargar modelo GLB
        const loader = new GLTFLoader();
        loader.load(
          "{{ asset('3d/oficial.glb') }}",
          function (gltf) {
            mesh = gltf.scene;
            mesh.traverse(function (child) {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            mesh.position.y = 0;
            scene.add(mesh);

            mixer = new THREE.AnimationMixer(mesh);

            let animation1 = window.document.getElementById("animacion1");
            action = mixer.clipAction(gltf.animations[0]);
            clip = gltf.animations[0];

            animation1.addEventListener("click", function () {
              // 1) obtén la acción

              // 2) asegúrate de que arranque en frame 0
              action.reset();

              // 3) que solo haga la animación UNA vez
              action.setLoop(THREE.LoopOnce, 1);

              action.clampWhenFinished = true;

              // 4) al acabar, que se quede en la pose final
              //action.clampWhen = true;

              // (opcional) suaviza la pendiente para que no "salte" al final
              action.zeroSlopeAtEnd = true;
              // 5) velocidad normal
              action.timeScale = 5;

              // 6) y por fin, arranca
              action.play();
            });

            // 7) Cuando el mixer dispare el evento "finished"
            mixer.addEventListener("finished", (e) => {
              console.log("asssss");
            });
          },
          undefined,
          function (error) {
            console.error("Error al cargar car.glb:", error);
          }
        );

        // Renderizador
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animate);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        // Controles
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.5, 0);
        controls.update();

        // Resize
        window.addEventListener("resize", onWindowResize);

        // GUI
        const gui = new GUI();
        gui.open();
      }

      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }

      function animate() {
        //
        if (mixer) {
          mixer.update(0.01);
        }

        renderer.render(scene, camera);
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
          new Blob([buffer], { type: "application/octet-stream" }),
          filename
        );
      }
    </script>
  </body>
</html>
