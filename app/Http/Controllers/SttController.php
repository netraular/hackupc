<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Google\Cloud\Speech\V1\SpeechClient;
use Google\Cloud\Speech\V1\RecognitionAudio;
use Google\Cloud\Speech\V1\RecognitionConfig;
use Google\Cloud\Speech\V1\RecognitionConfig\AudioEncoding;
use Illuminate\Support\Facades\Log; // Para logs
use Illuminate\Support\Facades\Validator; // Para validación

class SttController extends Controller
{
    // Vista de prueba existente
    public function showTestView()
    {
        return view('stt-test'); // Asegúrate que esta vista exista en resources/views/
    }

    // Método existente para la vista de prueba
    public function transcribeAudio(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimes:wav,mp3,flac,ogg,webm,aac,m4a', // Amplía los mimes si es necesario
        ]);

        try {
            $audioFile = $request->file('audio');
            $transcription = $this->recognizeAudio($audioFile->getRealPath(), $audioFile->getMimeType());

            if ($transcription) {
                return back()->with('transcription', $transcription);
            } else {
                return back()->withErrors(['audio' => 'No se pudo reconocer texto en el audio.']);
            }
        } catch (\Google\ApiCore\ApiException $e) {
            Log::error("Google API Exception during STT: " . $e->getMessage());
            return back()->withErrors(['audio' => 'Error al comunicar con la API de Google Speech: ' . $e->getMessage()]);
        } catch (\Exception $e) {
             Log::error("General Exception during STT: " . $e->getMessage());
            return back()->withErrors(['audio' => 'Ocurrió un error inesperado durante la transcripción: ' . $e->getMessage()]);
        }
    }

    // --- NUEVO MÉTODO PARA EL CHAT (AJAX) ---
    public function transcribeForChat(Request $request)
    {
        // Validación específica para la subida desde el chat
        $validator = Validator::make($request->all(), [
            // Ajusta los mimes según lo que MediaRecorder pueda generar y Google soporte
             // webm, ogg (con opus/vorbis), flac, wav, mp3 son buenas opciones
            'audio' => 'required|file|mimes:webm,ogg,wav,mp3,flac|max:10240', // Max 10MB, ajusta si es necesario
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Archivo inválido: ' . $validator->errors()->first('audio') // Devuelve el primer error de validación
            ], 400); // Bad Request
        }

        try {
            $audioFile = $request->file('audio');
            $filePath = $audioFile->getRealPath();
            $mimeType = $audioFile->getMimeType(); // Obtener el mime type real

            Log::info("STT Request - MimeType: " . $mimeType . ", Size: " . $audioFile->getSize());

            $transcription = $this->recognizeAudio($filePath, $mimeType);

            if ($transcription) {
                 Log::info("STT Success - Transcription: " . $transcription);
                return response()->json([
                    'success' => true,
                    'transcription' => $transcription
                ]);
            } else {
                 Log::warning("STT Failed - No transcription result for file.");
                return response()->json([
                    'success' => false,
                    'error' => 'No se pudo reconocer texto en el audio.'
                ], 400); // Bad Request o tal vez 200 con success false? Depende de cómo quieras manejarlo
            }
        } catch (\Google\ApiCore\ApiException $e) {
            Log::error("Google API Exception during STT (Chat): " . $e->getMessage() . " Code: " . $e->getCode());
             // Podrías devolver mensajes más específicos según $e->getCode() si es necesario
            return response()->json([
                'success' => false,
                'error' => 'Error al procesar el audio con la API externa.' // Mensaje genérico para el usuario
            ], 500); // Internal Server Error
        } catch (\Exception $e) {
            Log::error("General Exception during STT (Chat): " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Ocurrió un error inesperado en el servidor.'
            ], 500); // Internal Server Error
        }
    }


    // --- FUNCIÓN HELPER REUTILIZABLE PARA LLAMAR A GOOGLE API ---
    private function recognizeAudio(string $filePath, ?string $mimeType = null): ?string
    {
        // Asegúrate de tener tus credenciales de Google Cloud configuradas
        // ya sea mediante variable de entorno GOOGLE_APPLICATION_CREDENTIALS
        // o explícitamente aquí (menos recomendado).
        try {
            $speechClient = new SpeechClient([
                // 'keyFilePath' => '/ruta/a/tu/keyfile.json', // Si no usas variable de entorno
                // Puedes añadir opciones de cliente aquí si es necesario (ej. endpoint)
            ]);

            $audioContent = file_get_contents($filePath);

            // Configuración del reconocimiento
            $config = new RecognitionConfig();
            // --- Determinar codificación basada en MimeType ---
            // Esto es crucial para que Google entienda el archivo
            $encoding = AudioEncoding::LINEAR16; // Default seguro para WAV
            $sampleRateHertz = 16000;       // Default común, ajustar si es necesario/posible

             if ($mimeType) {
                if (str_contains($mimeType, 'webm')) {
                     // OGG_OPUS es más probable para webm de navegador que WEBM_OPUS
                    $encoding = AudioEncoding::OGG_OPUS;
                    // La sample rate suele estar embebida en Opus/Vorbis, pero puedes especificarla si la conoces
                    // Google recomienda dejarla en 0 para que la detecte automáticamente para Opus/Vorbis/Flac
                    $sampleRateHertz = 0; // Dejar que Google detecte para OGG_OPUS
                } elseif (str_contains($mimeType, 'ogg')) {
                    $encoding = AudioEncoding::OGG_OPUS; // O podría ser OGG_VORBIS
                     $sampleRateHertz = 0; // Dejar que Google detecte
                } elseif (str_contains($mimeType, 'flac')) {
                    $encoding = AudioEncoding::FLAC;
                     $sampleRateHertz = 0; // Dejar que Google detecte
                } elseif (str_contains($mimeType, 'mp3')) {
                    $encoding = AudioEncoding::MP3;
                     // Para MP3, necesitas especificar la sample rate si no es 16000
                     // $sampleRateHertz = 44100; // o la que sea
                     $sampleRateHertz = 0; // Intentar autodetección si es posible
                } elseif (str_contains($mimeType, 'wav')) {
                    $encoding = AudioEncoding::LINEAR16; // O MULAW / ALAW si sabes que es eso
                     // Podrías intentar leer el header WAV para obtener sample rate
                     // Por ahora, asumimos 16000Hz o dejamos 0 si la API lo permite
                     $sampleRateHertz = 0; // Intentar autodetección si es posible, si no, poner 16000
                }
                // Añadir más casos según sea necesario (aac -> requiere convertir o usar API específica?)
            } else {
                 Log::warning("STT: MimeType no disponible, asumiendo LINEAR16/16000Hz.");
                 // Si no hay mime type, es difícil saber. Podrías intentar adivinar o fallar.
            }

            Log::info("STT Config - Encoding: " . AudioEncoding::name($encoding) . ", SampleRate: " . ($sampleRateHertz ?: 'Auto'));

            $config->setEncoding($encoding);
            if ($sampleRateHertz > 0) { // Solo establecer si no es 0 (auto)
                 $config->setSampleRateHertz($sampleRateHertz);
            }
            $config->setLanguageCode('es-ES'); // O el idioma que necesites 'en-US', etc.
            // $config->setEnableAutomaticPunctuation(true); // Opcional: mejora la puntuación

            // Crear el objeto de audio
            $audio = new RecognitionAudio();
            $audio->setContent($audioContent);

            // Realizar la solicitud de reconocimiento
            $response = $speechClient->recognize($config, $audio);

            $transcription = null;
            // Procesar los resultados
            foreach ($response->getResults() as $result) {
                $alternatives = $result->getAlternatives();
                if (count($alternatives) > 0) {
                    $transcription = $alternatives[0]->getTranscript(); // Tomar la alternativa más probable
                    break; // Usualmente solo necesitamos el primer resultado completo
                }
            }

            $speechClient->close();
            return $transcription;

        } catch (\Google\ApiCore\ApiException $e) {
            Log::error("Google API Exception in recognizeAudio: " . $e->getMessage() . " Code: " . $e->getCode());
            // Relanzar para que el método llamador la maneje
            throw $e;
        } catch (\Exception $e) {
            Log::error("General Exception in recognizeAudio: " . $e->getMessage());
             // Relanzar para que el método llamador la maneje
            throw $e;
        }

        return null; // Si algo falla o no hay resultados
    }
}