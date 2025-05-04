<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Response; // Para respuestas HTTP más específicas si se necesitan

class TtsController extends Controller
{
    /**
     * Muestra la vista de prueba para TTS.
     */
    public function showTestView()
    {
        return view('tts_test'); // Asegúrate que resources/views/tts_test.blade.php exista
    }

    /**
     * Recibe texto, lo pasa a un script Python para síntesis vía Google Cloud TTS,
     * y devuelve el audio resultante (como Base64 JSON).
     */
    public function synthesizeText(Request $request)
    {
        $request->validate([
            'text' => 'required|string|max:1000', // Mantener límite razonable
        ]);

        $textToSynthesize = $request->input('text');
        Log::info('Recibida petición de síntesis TTS (vía script Python) para texto: ' . substr($textToSynthesize, 0, 50) . '...');

        try {
            // --- Configuración para ejecutar el script Python ---
            $pythonExecutable = base_path('py-venv/bin/python'); // AJUSTA si tu venv o ejecutable se llama diferente
            $scriptPath = base_path('scripts/synthesize_text.py'); // AJUSTA si tu script está en otro lugar
            $projectId = config('services.google.project_id');

            // Obtener configuración TTS desde .env/config (con valores por defecto)
            $languageCode = config('services.google.tts.language_code');
            $voiceName = config('services.google.tts.voice_name');
            $outputEncoding = 'MP3'; // O hacerlo configurable si es necesario

            // --- Verificaciones de Configuración ---
            if (!$projectId) {
                Log::error('Google Project ID no configurado (services.google.project_id)');
                throw new \Exception('Configuración incompleta: Falta el ID del proyecto de Google.');
            }
            if (!file_exists($pythonExecutable)) {
                Log::error('Ejecutable de Python del venv NO encontrado en: ' . $pythonExecutable);
                throw new \Exception('Configuración incorrecta: No se encuentra Python del venv.');
            }
            if (!file_exists($scriptPath)) {
                Log::error('Script Python TTS NO encontrado en: ' . $scriptPath);
                throw new \Exception('Configuración incorrecta: No se encuentra el script de síntesis.');
            }

            // --- Autenticación (Pasar ENV explícitamente) ---
            $googleCredentialsPath = config('services.google.credentials');
            $processEnv = [];
            if ($googleCredentialsPath && file_exists($googleCredentialsPath)) {
                $processEnv['GOOGLE_APPLICATION_CREDENTIALS'] = $googleCredentialsPath;
                Log::info("Pasando explícitamente GOOGLE_APPLICATION_CREDENTIALS al script Python TTS.");
            } else {
                Log::warning("Credenciales GOOGLE_APPLICATION_CREDENTIALS no encontradas o no configuradas. Script Python intentará ADC.");
            }

            // --- Crear y Ejecutar el Proceso ---
            $command = [
                $pythonExecutable,
                $scriptPath,
                $textToSynthesize, // Argumento posicional: el texto
                '--project-id', $projectId,
                '--language-code', $languageCode,
                '--voice-name', $voiceName,
                '--output-encoding', $outputEncoding,
            ];

            Log::debug("Ejecutando comando TTS: " . implode(' ', array_map('escapeshellarg', $command))); // Cuidado con textos largos en logs

            $process = new Process($command);

            // Establecer entorno si es necesario
            if (!empty($processEnv)) {
                $process->setEnv($processEnv);
            }

            $process->setTimeout(60); // Timeout de 60 segundos (ajustar si es necesario)
            $process->mustRun(); // Lanza excepción si falla

            // --- Obtener Salida (Bytes de Audio) ---
            $audioContentBytes = $process->getOutput(); // Obtiene los bytes crudos de stdout
            $errorOutput = $process->getErrorOutput(); // Obtener stderr para debug/warnings

             if (!empty($errorOutput)) {
                Log::warning("Salida de error (stderr) del script Python TTS (puede ser sólo debug/warning): " . $errorOutput);
            }

            if (empty($audioContentBytes)) {
                Log::error("El script Python TTS finalizó correctamente pero no devolvió contenido de audio.");
                return response()->json(['error' => 'No se pudo generar el audio (respuesta vacía del script).'], 500);
            }

            // --- Preparar Respuesta (Base64 JSON, como el original) ---
            $audioContentBase64 = base64_encode($audioContentBytes);
            $mimeType = 'audio/mpeg'; // Para MP3

            Log::info('Audio TTS (vía script Python) generado correctamente.');

            // Devolver el audio en Base64
            return response()->json([
                'audio_base64' => $audioContentBase64,
                'mime_type' => $mimeType
            ]);

        } catch (ProcessFailedException $exception) {
            $errorOutput = $exception->getProcess()->getErrorOutput();
            Log::error('Error al ejecutar el script Python TTS: ' . $exception->getMessage());
            Log::error('Código de salida del script Python TTS: ' . $exception->getProcess()->getExitCode());
            Log::error('Salida de error (stderr) del script Python TTS: ' . $errorOutput);
            return response()->json([
                'error' => 'Error durante la generación de audio vía script.',
                'details' => $this->cleanErrorMessage($errorOutput) // Usar helper si lo tienes
                ], 500);

        } catch (\Throwable $e) { // Captura Exception y Error
            Log::error('Error inesperado en TtsController: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Error interno del servidor al generar el audio.'], 500);
        }
        // No necesitamos 'finally' aquí ya que no creamos archivos temporales
    }

    /**
     * Limpia los mensajes de error de stderr del script Python (reutilizado de SttController).
     * @param string $errorOutput
     * @return string
     */
    private function cleanErrorMessage(string $errorOutput): string
    {
        // Implementación simple (igual o similar a la de SttController)
        $errorOutput = trim($errorOutput);
        if (empty($errorOutput)) return 'Script sin salida de error específica.';
        $lines = explode("\n", $errorOutput);
        $relevantLines = array_filter($lines, function($line) {
            return preg_match('/^(Error|Exception|Traceback|Fatal|Critical|Warning)/i', trim($line));
        });
        if (!empty($relevantLines)) {
             $message = implode('; ', $relevantLines);
             return strlen($message) > 250 ? substr($message, 0, 247) . '...' : $message;
        }
        $lastLines = array_slice(array_filter($lines, 'trim'), -3);
        $message = implode('; ', array_map('trim', $lastLines));
        return strlen($message) > 250 ? substr($message, 0, 247) . '...' : $message;
    }
}