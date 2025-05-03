<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Prueba de Text-to-Speech (TTS)</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        #tts-form { margin-bottom: 20px; }
        textarea { width: 100%; min-height: 80px; margin-bottom: 10px; }
        #audio-container { margin-top: 20px; }
        #audio-output { width: 100%; margin-top: 10px; }
        #status { margin-top: 10px; font-style: italic; color: #555; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { color: red; font-weight: bold; }
    </style>
</head>
<body>

    <h1>Prueba de Google Text-to-Speech</h1>

    <form id="tts-form">
        @csrf <!-- Token CSRF necesario para POST -->
        <label for="text-input">Introduce el texto a sintetizar:</label><br>
        <textarea id="text-input" name="text" required maxlength="1000"></textarea>
        <br>
        <button type="submit" id="submit-button">Generar Audio</button>
    </form>

    <div id="status"></div>
    <div id="audio-container">
        <strong>Audio Generado:</strong><br>
        <audio id="audio-output" controls style="display: none;"></audio>
    </div>

    <script>
        const ttsForm = document.getElementById('tts-form');
        const textInput = document.getElementById('text-input');
        const submitButton = document.getElementById('submit-button');
        const statusDiv = document.getElementById('status');
        const audioOutput = document.getElementById('audio-output');
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        ttsForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const textToSynthesize = textInput.value.trim();
            if (!textToSynthesize) {
                statusDiv.textContent = 'Por favor, introduce algún texto.';
                statusDiv.className = 'error';
                return;
            }

            statusDiv.textContent = 'Generando audio...';
            statusDiv.className = ''; // Resetear clase de error
            audioOutput.style.display = 'none'; // Ocultar reproductor previo
            audioOutput.removeAttribute('src'); // Limpiar fuente previa
            submitButton.disabled = true;

            try {
                const response = await fetch('{{ route("tts.synthesize") }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Enviamos JSON
                        'Accept': 'application/json',       // Esperamos JSON
                        'X-CSRF-TOKEN': csrfToken           // Token CSRF
                    },
                    body: JSON.stringify({ text: textToSynthesize }) // Cuerpo como JSON
                });

                const result = await response.json();

                if (response.ok && result.audio_base64) {
                    // Crear Data URL para el audio
                    const audioDataUrl = `data:${result.mime_type || 'audio/mpeg'};base64,${result.audio_base64}`;
                    audioOutput.src = audioDataUrl;
                    audioOutput.style.display = 'block'; // Mostrar el reproductor
                    statusDiv.textContent = 'Audio generado correctamente.';
                    statusDiv.className = 'success';
                     // audioOutput.play(); // Opcional: reproducir automáticamente
                } else {
                    // Mostrar error del backend
                    statusDiv.textContent = `Error: ${result.error || response.statusText}`;
                    statusDiv.className = 'error';
                }

            } catch (error) {
                console.error('Error en la petición fetch:', error);
                statusDiv.textContent = 'Error de red o en la petición. Revisa la consola.';
                statusDiv.className = 'error';
            } finally {
                submitButton.disabled = false; // Reactivar el botón
            }
        });
    </script>

</body>
</html>