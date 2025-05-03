<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Prueba STT - Google API</title>
</head>
<body>
    <h1>Reconocimiento de Voz (STT)</h1>

    @if (session('transcription'))
        <div style="background-color: #e6ffe6; padding: 10px; margin-top: 20px;">
            <strong>Texto Reconocido:</strong>
            <p>{{ session('transcription') }}</p>
        </div>
    @endif

    @if ($errors->any())
        <div style="color: red; margin-top: 20px;">
            <strong>Errores:</strong>
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form action="{{ route('stt.transcribe') }}" method="POST" enctype="multipart/form-data" style="margin-top: 20px;">
        @csrf
        <label for="audio">Selecciona un archivo de audio (.wav o .mp3):</label><br>
        <input type="file" name="audio" accept="audio/*" required><br><br>
        <button type="submit">Enviar y Transcribir</button>
    </form>
</body>
</html>
