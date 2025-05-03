<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Google\Cloud\Speech\V2\SpeechClient;
use Google\Cloud\Speech\V2\RecognitionAudio;
use Google\Cloud\Speech\V2\RecognitionConfig;
use Google\Cloud\Speech\V2\RecognitionConfig\AutoDetectDecodingConfig;

class SttController extends Controller
{
    public function showTestView()
    {
        return view('stt_test');
    }

    public function transcribeAudio(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimetypes:audio/wav,audio/x-wav,audio/mpeg,audio/mp3|max:10240',
        ]);

        // Subir archivo a storage/app/audio_temp/
        $audioFile = $request->file('audio');

        $folder = storage_path('app/audio_temp');
        if (!file_exists($folder)) {
            mkdir($folder, 0755, true);
        }

        $filename = uniqid() . '.' . $audioFile->getClientOriginalExtension();
        $audioFile->move($folder, $filename);

        $fullPath = $folder . '/' . $filename;

        if (!file_exists($fullPath)) {
            return back()->withErrors(['Archivo no encontrado después de subir: ' . $fullPath]);
        }

        $audioContent = file_get_contents($fullPath);

        $credentialsPath = config('services.google.credentials');
        if (!$credentialsPath || !file_exists($credentialsPath)) {
            return back()->withErrors(['Credenciales de Google no encontradas.']);
        }

        // Instanciar SpeechClient con credenciales
        $speechClient = new SpeechClient([
            'credentials' => $credentialsPath
        ]);

        $audio = new RecognitionAudio([
            'content' => $audioContent
        ]);

        $config = new RecognitionConfig([
            'auto_detect_decoding_config' => new AutoDetectDecodingConfig(), // detecta MP3/WAV automáticamente
            'language_codes' => ['es-ES'],
            'model' => 'latest_long',
        ]);

        try {
            $response = $speechClient->recognize([
                'config' => $config,
                'audio' => $audio,
            ]);
        } catch (\Exception $e) {
            return back()->withErrors(['Error al transcribir: ' . $e->getMessage()]);
        } finally {
            $speechClient->close();
        }

        $transcription = '';
        foreach ($response->getResults() as $result) {
            $alternatives = $result->getAlternatives();
            if (count($alternatives) > 0) {
                $transcription .= $alternatives[0]->getTranscript() . ' ';
            }
        }

        return back()->with('transcription', trim($transcription));
    }
}
