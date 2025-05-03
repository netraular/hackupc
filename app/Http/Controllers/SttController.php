<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Google\Cloud\Speech\V2\Client\SpeechClient;
use Google\Cloud\Speech\V2\CreateRecognizerRequest;
use Google\Cloud\Speech\V2\RecognizeRequest;
use Google\Cloud\Speech\V2\RecognizeResponse;

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
        try {
            $speechClient = new SpeechClient([
                'credentials' => $credentialsPath
            ]);

            // Obtener o crear el proyecto
            $projectId = config('services.google.project_id');
            $location = 'global'; // o la ubicación específica que estés utilizando

            // Crear la solicitud de reconocimiento
            $request = new RecognizeRequest();
            $request->setRecognizer("projects/{$projectId}/locations/{$location}/recognizers/_");
            $request->setContent($audioContent);
            $request->setConfig([
                'languageCodes' => ['es-ES'],
                'model' => 'latest_long',
            ]);

            // Enviar la solicitud
            $response = $speechClient->recognize($request);

            // Procesar la respuesta
            $transcription = '';
            foreach ($response->getResults() as $result) {
                foreach ($result->getAlternatives() as $alternative) {
                    $transcription .= $alternative->getTranscript() . ' ';
                }
            }

            // Eliminar el archivo temporal
            @unlink($fullPath);

            return back()->with('transcription', trim($transcription));
            
        } catch (\Exception $e) {
            @unlink($fullPath); // Intentar eliminar el archivo incluso si hay error
            return back()->withErrors(['Error al transcribir: ' . $e->getMessage()]);
        }
    }
}