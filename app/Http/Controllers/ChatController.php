<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    public function index()
    {
        return view('chat');
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $userMessage = $request->input('message');
        $webhookUrl = config('services.n8n.webhook_url');

        if (!$webhookUrl) {
            Log::error('La variable de entorno N8N_WEBHOOK_URL no está definida.');
            // Devuelve un objeto JSON con error y una clave 'reply' genérica para el frontend
            return response()->json([
                'error' => 'Configuración interna del servidor incompleta.',
                'reply' => 'Sorry, the server configuration is incomplete.' // Added reply key
            ], 500);
        }

        Log::info('Enviando mensaje de texto a n8n: ' . $userMessage);

        try {
            $n8nResponse = Http::timeout(60)->post($webhookUrl, [
                'message' => $userMessage,
            ]);

            if ($n8nResponse->successful()) {
                Log::debug('Respuesta cruda de n8n:', ['raw_body' => $n8nResponse->body()]);
                $responseData = $n8nResponse->json();
                Log::debug('Respuesta parseada de n8n:', ['parsed_data' => $responseData]);

                if ($responseData === null && !empty($n8nResponse->body())) {
                    Log::error('La respuesta de n8n no parece ser JSON válido.', ['raw_body' => $n8nResponse->body()]);
                    // Devuelve un objeto JSON con error y una clave 'reply' genérica
                    return response()->json([
                        'error' => 'Invalid format received from agent.',
                        'reply' => 'Sorry, I received an improperly formatted response from the agent.' // Added reply key
                    ], 500);
                }

                // --- CAMBIO CLAVE: Extraer el objeto 'output' completo ---
                // Esperamos que la respuesta parseada tenga una clave 'output'
                // y que su valor sea un objeto (o array asociativo en PHP).
                $aiResponseObject = $responseData['output'] ?? null;

                // Validar que 'output' existe y es un array (json_decode lo convierte en array asociativo)
                if (!$aiResponseObject || !is_array($aiResponseObject)) {
                     Log::error('La respuesta de n8n no contiene la clave "output" como objeto esperado o está vacía.', ['response_data' => $responseData]);
                     // Devuelve un objeto JSON con error y una clave 'reply' genérica
                     return response()->json([
                         'error' => 'Unexpected response structure from agent.',
                         'reply' => 'Sorry, I received an unexpected response structure from the agent.' // Added reply key
                     ], 500);
                }

                // Loguear el objeto que se va a devolver
                Log::info('Objeto de respuesta del AI (n8n) a devolver: ', $aiResponseObject);

                // --- CAMBIO CLAVE: Devolver el objeto 'output' completo directamente ---
                // Laravel lo codificará automáticamente como JSON.
                // La respuesta será: {"message": "...", "animations": "[]"}
                return response()->json($aiResponseObject);

            } else {
                Log::error('Error llamando al webhook de n8n:', [
                    'status' => $n8nResponse->status(),
                    'body' => $n8nResponse->body(),
                    'url' => $webhookUrl,
                    'message_sent' => $userMessage
                ]);
                $errorBody = $n8nResponse->json() ?? ['message' => $n8nResponse->body()];
                $errorMessage = $errorBody['message'] ?? 'The AI agent could not respond.';
                // Devuelve un objeto JSON con error y una clave 'reply' genérica
                return response()->json([
                    'error' => $errorMessage,
                    'reply' => "Sorry, the AI agent encountered an error ({$n8nResponse->status()})." // Added reply key
                ], $n8nResponse->status());
            }

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Error de conexión con el webhook de n8n: ' . $e->getMessage(), ['url' => $webhookUrl]);
             // Devuelve un objeto JSON con error y una clave 'reply' genérica
            return response()->json([
                'error' => 'Could not connect to the AI agent.',
                'reply' => 'Sorry, I couldn\'t connect to the AI agent right now.' // Added reply key
            ], 504); // Gateway Timeout
        } catch (\Exception $e) {
            Log::error('Error inesperado en ChatController::sendMessage: ' . $e->getMessage(), ['exception' => $e]);
             // Devuelve un objeto JSON con error y una clave 'reply' genérica
            return response()->json([
                'error' => 'An unexpected error occurred.',
                'reply' => 'Sorry, an unexpected error occurred.' // Added reply key
            ], 500); // Internal Server Error
        }
    }
}