<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\File; // Usar File facade para manejo de directorios/archivos

class SttController extends Controller
{
    /**
     * Muestra la vista de prueba para subir audio.
     *
     * @return \Illuminate\View\View
     */
    public function showTestView()
    {
        return view('stt_test'); // Asegúrate de que exista resources/views/stt_test.blade.php
    }

    /**
     * Procesa el archivo de audio subido, lo pasa a un script Python para transcripción
     * vía Google Cloud Speech V2 y devuelve el resultado.
     * Pasa explícitamente la variable de entorno GOOGLE_APPLICATION_CREDENTIALS al proceso hijo.
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function transcribeAudio(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimetypes:audio/wav,audio/x-wav,audio/mpeg,audio/mp3,audio/ogg,audio/flac|max:20480', // 20MB Max
        ]);

        $audioFile = $request->file('audio');
        $fullPath = null; // Inicializar la variable de ruta

        try {
            // --- 1. Subir archivo a storage/app/audio_temp/ ---
            $folder = storage_path('app/audio_temp');
            if (!File::isDirectory($folder)) {
                File::makeDirectory($folder, 0755, true, true);
                Log::info("Directorio de audio temporal creado en: " . $folder);
            } elseif (!is_writable($folder)) {
                Log::error("El directorio de audio temporal no tiene permisos de escritura: " . $folder);
                throw new \Exception("Error de configuración del servidor: Permisos incorrectos en el directorio de almacenamiento temporal.");
            }

            $originalExtension = $audioFile->getClientOriginalExtension();
            $filename = uniqid('audio_', true) . '.' . $originalExtension;
            $audioFile->move($folder, $filename);
            $fullPath = $folder . DIRECTORY_SEPARATOR . $filename;

            if (!file_exists($fullPath)) {
                 Log::error('Archivo no encontrado después de moverlo: ' . $fullPath);
                 $fullPath = null;
                 return back()->withErrors(['Error interno del servidor al guardar el archivo de audio.']);
            }
            Log::info("Archivo de audio subido y guardado temporalmente en: " . $fullPath);

            // --- 2. Configurar y Ejecutar el Script de Python ---
            $pythonExecutable = base_path('py-venv/bin/python'); // AJUSTA si tu venv o ejecutable se llama diferente
            $scriptPath = base_path('scripts/transcribe_audio.py'); // AJUSTA si tu script está en otro lugar
            $projectId = config('services.google.project_id');

            // --- Verificaciones de Configuración ---
            if (!$projectId) {
                 Log::error('Google Project ID no configurado en config/services.php o .env (services.google.project_id)');
                 throw new \Exception('Configuración incompleta: Falta el ID del proyecto de Google.');
            }
            if (!file_exists($pythonExecutable)) {
                 Log::error('Ejecutable de Python del venv NO encontrado en: ' . $pythonExecutable);
                 throw new \Exception('Configuración incorrecta: No se encuentra el ejecutable de Python del entorno virtual.');
            }
            if (!file_exists($scriptPath)) {
                 Log::error('Script de Python NO encontrado en: ' . $scriptPath);
                 throw new \Exception('Configuración incorrecta: No se encuentra el script de transcripción.');
            }

            // --- Autenticación de Google Cloud para Python (PASANDO ENV EXPLICITAMENTE) ---
            $googleCredentialsPath = config('services.google.credentials'); // Lee la ruta desde config/services.php (que a su vez lee .env)
            $processEnv = []; // Array para las variables de entorno del proceso hijo

            // --- IMPORTANTE: Verificar que 'credentials' esté definido en config/services.php ---
            // Asegúrate de tener en config/services.php:
            // 'google' => [
            //     'project_id' => env('GOOGLE_PROJECT_ID'),
            //     'credentials' => env('GOOGLE_APPLICATION_CREDENTIALS'), // <-- ¡Esta línea es crucial!
            // ],

            if ($googleCredentialsPath && file_exists($googleCredentialsPath)) {
                // Si la ruta está definida en Laravel y el archivo existe,
                // la añadimos al array de entorno que se pasará al proceso Python.
                $processEnv['GOOGLE_APPLICATION_CREDENTIALS'] = $googleCredentialsPath;
                Log::info("Pasando explícitamente GOOGLE_APPLICATION_CREDENTIALS al script Python: " . $googleCredentialsPath);
            } else {
                // Si no se encontró la ruta o el archivo, el script Python probablemente intentará usar ADC.
                // Se loguea una advertencia clara.
                Log::warning("No se encontró archivo de credenciales en la ruta especificada por GOOGLE_APPLICATION_CREDENTIALS ('" . ($googleCredentialsPath ?: 'No configurada') . "') en .env/config. El script Python intentará usar ADC o fallará si no puede.");
                // No lanzamos excepción aquí, dejamos que el script Python falle si no puede autenticarse por otros medios (ADC).
            }


            // --- Crear y Ejecutar el Proceso ---
            Log::info("Ejecutando script Python: {$pythonExecutable} {$scriptPath} '{$fullPath}' --project-id {$projectId}");

            $process = new Process([
                $pythonExecutable,
                $scriptPath,
                $fullPath,
                '--project-id', $projectId
            ]);

            // Establecer el entorno para el proceso hijo SI DEFINIMOS VARIABLES
            // Esto inyecta las variables de $processEnv en el entorno del script Python.
            if (!empty($processEnv)) {
                $process->setEnv($processEnv);
            }

            $process->setTimeout(180); // 3 minutos timeout
            $process->mustRun(); // Lanza excepción si falla

            // --- 3. Obtener la Salida (Transcripción) ---
            $transcription = trim($process->getOutput());
            $errorOutput = trim($process->getErrorOutput());

            if (!empty($errorOutput)) {
                // Loguear stderr incluso si el proceso terminó con éxito (código 0)
                Log::warning("Salida de error (stderr) del script Python (puede ser sólo un warning): " . $errorOutput);
            }
            Log::info("Transcripción recibida del script Python para el archivo: " . basename($fullPath));

            // --- 4. Devolver la transcripción ---
            if (empty($transcription) && empty($this->filterPythonWarnings($errorOutput))) {
                 Log::warning('La transcripción está vacía (posiblemente audio sin habla) para el archivo: ' . basename($fullPath));
                 return back()->with('transcription', '(Audio sin contenido transcribible o transcripción vacía)');
            } elseif (empty($transcription) && !empty($errorOutput)) {
                 // Si no hay transcripción pero sí hubo mensajes en stderr
                 return back()->with('transcription', '(No se generó transcripción - ver logs para detalles)');
            }
            return back()->with('transcription', $transcription);

        } catch (ProcessFailedException $exception) {
            // El script Python falló (exit code != 0)
            $errorOutput = $exception->getProcess()->getErrorOutput();
            Log::error('Error al ejecutar el script Python: ' . $exception->getMessage());
            Log::error('Código de salida del script Python: ' . $exception->getProcess()->getExitCode());
            Log::error('Salida de error (stderr) del script Python: ' . $errorOutput);
            return back()->withErrors([
                'transcription_error' => 'Error durante la transcripción.',
                'script_error' => 'Detalles del script: ' . $this->cleanErrorMessage($errorOutput)
            ]);

        } catch (\Throwable $e) { // Captura Exception y Error (PHP 7+)
            Log::error('Error inesperado en SttController: ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->withErrors(['Error interno del servidor: ' . $e->getMessage()]);

        } finally {
            // --- 5. Limpiar el archivo temporal (SIEMPRE intentar) ---
            if ($fullPath && file_exists($fullPath)) {
                Log::info("Eliminando archivo de audio temporal: " . $fullPath);
                if (!@unlink($fullPath)) {
                     Log::error("No se pudo eliminar el archivo temporal: " . $fullPath);
                }
            }
        }
    }

    /**
     * Limpia los mensajes de error de stderr del script Python para mostrarlos al usuario.
     *
     * @param string $errorOutput Salida de stderr del proceso.
     * @return string Mensaje de error limpiado o un resumen.
     */
    private function cleanErrorMessage(string $errorOutput): string
    {
        // Reutilizamos la función cleanErrorMessage anterior, pero podríamos filtrarla más si es necesario
        $errorOutput = trim($errorOutput);
        if (empty($errorOutput)) {
            return 'El script no produjo salida de error específica.';
        }
        $lines = explode("\n", $errorOutput);
        $relevantLines = [];
        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            if (empty($trimmedLine)) continue;
            // Priorizar mensajes de error claros
            if (preg_match('/^(Error|Exception|Traceback|Fatal|Critical)/i', $trimmedLine)) {
                $relevantLines[] = $trimmedLine;
            }
            // Incluir warnings si no hay errores claros
            elseif (empty($relevantLines) && preg_match('/^Warning/i', $trimmedLine)) {
                 $relevantLines[] = $trimmedLine;
            }
        }
        if (!empty($relevantLines)) {
            $message = implode('; ', $relevantLines);
            return strlen($message) > 250 ? substr($message, 0, 247) . '...' : $message;
        }
        // Si no, devolver las últimas líneas no vacías
        $lastLines = array_slice(array_filter($lines, 'trim'), -3);
        $message = implode('; ', array_map('trim', $lastLines));
        return strlen($message) > 250 ? substr($message, 0, 247) . '...' : $message;
    }

     /**
     * Filtra warnings comunes de Python que no indican un fallo real.
     *
     * @param string $errorOutput
     * @return string Error output sin los warnings filtrados.
     */
     private function filterPythonWarnings(string $errorOutput): string
     {
         $lines = explode("\n", $errorOutput);
         $filteredLines = [];
         foreach ($lines as $line) {
             // Ejemplo: Ignorar el warning específico sobre GOOGLE_APPLICATION_CREDENTIALS si estamos intentando ADC
             if (str_contains($line, "Warning: GOOGLE_APPLICATION_CREDENTIALS environment variable not set")) {
                 continue; // Ignorar esta línea específica si es sólo un warning y no un error real
             }
             // Podrías añadir más filtros aquí para otros warnings conocidos e inofensivos
             $filteredLines[] = $line;
         }
         return trim(implode("\n", $filteredLines));
     }
}