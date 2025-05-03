<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Google\Cloud\Speech\V1\SpeechClient;
use Google\Cloud\Speech\V1\RecognitionConfig;
use Google\Cloud\Speech\V1\RecognitionAudio;
use Google\Cloud\Speech\V1\RecognitionConfig\AudioEncoding;
use Google\ApiCore\ApiException;

class SttController extends Controller
{
    /**
     * Muestra la vista de prueba para STT.
     */
    public function showTestView()
    {
        // Creamos una vista simple para probar STT
        // Asegúrate de crear este archivo: resources/views/stt_test.blade.php
        return view('stt_test');
    }

    /**
     * Recibe un archivo de audio y lo transcribe usando Google Cloud Speech-to-Text.
     */
    public function transcribeAudio(Request $request)
    {
        $request->validate([
            // Validar que el archivo 'audio' esté presente y sea un archivo de audio válido
            'audio' => 'required|file|mimes:webm,ogg,mp3,wav,opus|max:10240', // Max 10MB, ajusta mimes/tamaño según necesites
        ]);

        Log::info('Recibida petición de transcripción STT.');

        $speechClient = null; // Inicializar fuera del try
        try {
            $audioFile = $request->file('audio');
            $audioContent = file_get_contents($audioFile->getRealPath());

            // Configura el cliente de Google Speech-to-Text
            $speechClient = new SpeechClient([
                // Usará GOOGLE_APPLICATION_CREDENTIALS automáticamente si está configurada
            ]);

            // Determinar el encoding. WEBM_OPUS o OGG_OPUS son comunes con MediaRecorder.
            // Si conviertes a WAV (PCM), usa LINEAR16.
            // Google recomienda FLAC o LINEAR16 para mejor calidad si es posible,
            // pero OPUS es eficiente para web.
            // Aquí asumimos WEBM/OPUS por defecto, ajusta si es necesario.
            // $mimeType = $audioFile->getMimeType(); // Puedes intentar detectarlo, pero puede ser impreciso
            $encoding = AudioEncoding::WEBM_OPUS; // O AudioEncoding::OGG_OPUS, AudioEncoding::LINEAR16 etc.
             // $sampleRateHertz = 48000; // Solo necesario para LINEAR16, FLAC.

            $recognitionConfig = (new RecognitionConfig())
                ->setEncoding($encoding)
                // ->setSampleRateHertz($sampleRateHertz) // Descomentar si usas LINEAR16 o FLAC
                ->setLanguageCode(env('GOOGLE_STT_LANGUAGE_CODE', 'en-US')) // Asegúrate de tener esta variable en .env
                ->setEnableAutomaticPunctuation(true);

            $recognitionAudio = (new RecognitionAudio())
                ->setContent($audioContent);

            Log::debug('Enviando audio a Google STT API...');
            $response = $speechClient->recognize($recognitionConfig, $recognitionAudio);
            Log::debug('Respuesta recibida de Google STT API.');

            $transcript = '';
            foreach ($response->getResults() as $result) {
                // Obtener la alternativa con mayor confianza
                if (count($result->getAlternatives()) > 0) {
                     $transcript .= $result->getAlternatives()[0]->getTranscript() . ' '; // Añade espacio entre frases
                }
            }
            $transcript = trim($transcript); // Quitar espacio final

            $speechClient->close(); // Cierra la conexión gRPC

            if (empty($transcript)) {
                Log::warning('Google STT no devolvió ninguna transcripción.', ['mime' => $audioFile->getMimeType()]);
                return response()->json(['error' => 'No se pudo entender el audio.'], 400);
            }

            Log::info('Audio transcrito: ' . $transcript);
            return response()->json(['transcript' => $transcript]);

        } catch (ApiException $e) {
            Log::error('Error en Google Cloud Speech API: ' . $e->getMessage(), ['code' => $e->getCode(), 'details' => $e->getMetadata()]);
            $speechClient?->close(); // Intenta cerrar si existe
            return response()->json(['error' => 'Error al procesar el audio con el servicio externo.'], 500);
        } catch (\Exception $e) {
            Log::error('Error procesando archivo de audio: ' . $e->getMessage());
            $speechClient?->close(); // Intenta cerrar si existe
            return response()->json(['error' => 'Error interno al procesar el audio.'], 500);
        }
    }
}