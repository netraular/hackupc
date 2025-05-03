<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>AR Placement Autónomo (Cubo)</title>

    <!-- Importar Three.js (como módulo desde CDN) -->
    <!-- ESTO ESTÁ BIEN: El importmap le dice al navegador dónde encontrar 'three'
         cuando tu script ar_experience1.js haga 'import * as THREE from 'three';' -->
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
        }
    </script>

    <style>
        body { margin: 0; overflow: hidden; background-color: #000; }
        canvas { display: block; }
        #ar-button-container {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
        }
         #ar-button-container button {
            padding: 12px 24px;
            border: 1px solid #fff;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.4);
            color: #fff;
            font: 1.1em sans-serif;
            cursor: pointer;
         }
         #ar-button-container button:hover {
             background: rgba(255, 255, 255, 0.3);
         }
         #ar-button-container button:active {
             background: rgba(255, 255, 255, 0.5);
         }
        #info {
            position: absolute;
            top: 10px;
            width: 100%;
            text-align: center;
            z-index: 100;
            color: white;
            background-color: rgba(0,0,0,0.5);
            padding: 10px 0;
            font-family: sans-serif;
            display: none; /* Oculto hasta entrar en AR */
        }
         .ar-error-message {
             position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%);
             background-color: rgba(255, 255, 255, 0.9); /* Fondo más opaco */
             color: #b94a48; /* Rojo oscuro */
             padding: 20px;
             border: 1px solid #d6e9c6;
             border-radius: 5px;
             font-family: sans-serif;
             text-align: center;
             z-index: 2000; /* Por encima de todo */
             box-shadow: 0 0 10px rgba(0,0,0,0.5); /* Sombra suave */
             max-width: 80%; /* Evitar que sea demasiado ancho */
         }
    </style>

    @vite('resources/js/ar/ar_experience1.js')
</head>
<body>
    <!-- Contenedor para el botón AR que generará ARButton.js -->
    <div id="ar-button-container"></div>

    <!-- Mensaje de instrucciones -->
    <div id="info">Busca una superficie horizontal y toca la pantalla para colocar el cubo.</div>

</body>
</html>