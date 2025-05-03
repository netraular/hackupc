<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Google\Cloud\TextToSpeech\V1\TextToSpeechClient;
use Google\Cloud\TextToSpeech\V1\SynthesisInput;
use Google\Cloud\TextToSpeech\V1\VoiceSelectionParams;
use Google\Cloud\TextToSpeech\V1\AudioConfig;
use Google\Cloud\TextToSpeech\V1\AudioEncoding as TextToSpeechAudioEncoding; // Alias para evitar conflicto
use Google\ApiCore\ApiException;

class TtsController extends Controller
{
    /**
     * Muestra la vista de prueba para TTS.
     */
    public function showTestView()
    {
        // Creamos una vista simple para probar TTS
        // Asegúrate de crear este archivo: resources/views/tts_test.blade.php
        return view('tts_test');
    }

    /**
     * Recibe texto y lo convierte a audio usando Google Cloud Text-to-Speech.
     */
    public function synthesizeText(Request $request)
    {
        $request->validate([
            'text' => 'required|string|max:1000', // Limita la longitud del texto
        ]);

        $textToSynthesize = $request->input('text');
        Log::info('Recibida petición de síntesis TTS para el texto: ' . substr($textToSynthesize, 0, 50) . '...');

        $ttsClient = null; // Inicializar fuera del try
        try {
            $ttsClient = new TextToSpeechClient([
                // Usará GOOGLE_APPLICATION_CREDENTIALS automáticamente
            ]);

            $synthesisInput = (new SynthesisInput())
                ->setText($textToSynthesize);

            // Configura la voz y el idioma (usa variables de entorno)
            $voice = (new VoiceSelectionParams())
                ->setLanguageCode(env('GOOGLE_TTS_LANGUAGE_CODE', 'en-US'))
                ->setName(env('GOOGLE_TTS_VOICE_NAME', 'en-US-Wavenet-D')); // Voz de alta calidad

            // Configura el formato de audio de salida (MP3 es ampliamente compatible)
            $audioConfig = (new AudioConfig())
                ->setAudioEncoding(TextToSpeechAudioEncoding::MP3);

            Log::debug('Enviando texto a Google TTS API...');
            $ttsResponse = $ttsClient->synthesizeSpeech($synthesisInput, $voice, $audioConfig);
            Log::debug('Respuesta recibida de Google TTS API.');

            $audioContent = $ttsResponse->getAudioContent();
            $audioContentBase64 = base64_encode($audioContent); // Codificar en Base64 para JSON

            $ttsClient->close(); // Cierra la conexión gRPC

            Log::info('Audio TTS generado correctamente.');
            // Devolver el audio en Base64
            return response()->json([
                'audio_base64' => $audioContentBase64,
                'mime_type' => 'audio/mpeg' // Informar al frontend que es MP3
            ]);

        } catch (ApiException $e) {
            Log::error('Error en Google Cloud Text-to-Speech API: ' . $e->getMessage(), ['code' => $e->getCode(), 'details' => $e->getMetadata()]);
            $ttsClient?->close();
            return response()->json(['error' => 'Error al generar el audio con el servicio externo.'], 500);
        } catch (\Exception $e) {
            Log::error('Error generando audio TTS: ' . $e->getMessage());
             $ttsClient?->close();
            return response()->json(['error' => 'Error interno al generar el audio.'], 500);
        }
    }
}