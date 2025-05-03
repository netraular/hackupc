<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Prueba de Speech-to-Text (STT)</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        #stt-form { margin-bottom: 20px; }
        #result-container { margin-top: 20px; border: 1px solid #ccc; padding: 15px; background-color: #f9f9f9; min-height: 50px; }
        #status { margin-top: 10px; font-style: italic; color: #555; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { color: red; font-weight: bold; }
    </style>
</head>
<body>

    <h1>Prueba de Google Speech-to-Text</h1>

    <form id="stt-form" enctype="multipart/form-data">
        @csrf <!-- Incluir token CSRF -->
        <label for="audio-file">Selecciona un archivo de audio (webm, ogg, mp3, wav, opus):</label><br>
        <input type="file" id="audio-file" name="audio" accept="audio/webm,audio/ogg,audio/mpeg,audio/wav,audio/opus" required>
        <br><br>
        <button type="submit" id="submit-button">Transcribir Audio</button>
    </form>

    <div id="status"></div>
    <div id="result-container">
        <strong>Transcripción:</strong>
        <pre id="transcript-output">Esperando audio...</pre>
    </div>

    <script>
        const sttForm = document.getElementById('stt-form');
        const audioFileInput = document.getElementById('audio-file');
        const submitButton = document.getElementById('submit-button');
        const statusDiv = document.getElementById('status');
        const transcriptOutput = document.getElementById('transcript-output');
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        sttForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Evitar el envío normal del formulario

            if (!audioFileInput.files || audioFileInput.files.length === 0) {
                statusDiv.textContent = 'Por favor, selecciona un archivo de audio.';
                statusDiv.className = 'error';
                return;
            }

            const audioFile = audioFileInput.files[0];
            const formData = new FormData();
            formData.append('audio', audioFile);
            // Nota: No necesitas añadir CSRF token a FormData explícitamente si lo tienes en el meta tag
            // y estás usando fetch estándar, pero añadirlo en headers es más explícito.

            statusDiv.textContent = 'Enviando y procesando audio...';
            statusDiv.className = ''; // Resetear clase de error
            transcriptOutput.textContent = '...';
            submitButton.disabled = true;

            try {
                const response = await fetch('{{ route("stt.transcribe") }}', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken, // Enviar token CSRF
                        'Accept': 'application/json' // Esperamos una respuesta JSON
                        // 'Content-Type' será establecido automáticamente por fetch para FormData
                    },
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    transcriptOutput.textContent = result.transcript || '(Transcripción vacía)';
                    statusDiv.textContent = 'Transcripción completada.';
                    statusDiv.className = 'success'; // Puedes añadir estilos para success
                } else {
                    // Mostrar error del backend
                    transcriptOutput.textContent = '(Error)';
                    statusDiv.textContent = `Error: ${result.error || response.statusText}`;
                    statusDiv.className = 'error';
                }

            } catch (error) {
                console.error('Error en la petición fetch:', error);
                transcriptOutput.textContent = '(Error)';
                statusDiv.textContent = 'Error de red o en la petición. Revisa la consola.';
                statusDiv.className = 'error';
            } finally {
                submitButton.disabled = false; // Reactivar el botón
                 // audioFileInput.value = ''; // Opcional: limpiar el input de archivo
            }
        });
    </script>

</body>
</html>