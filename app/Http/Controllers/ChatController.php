<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
// Ya no se necesitan los 'use' de Google Cloud ni Storage aquí

class ChatController extends Controller
{
    public function index()
    {
        // Devuelve la vista principal del chat (ahora solo texto)
        // Asegúrate de que resources/views/chat.blade.php exista
        return view('chat');
    }

    public function sendMessage(Request $request)
    {
        // Validación: Solo esperamos texto ahora
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $userMessage = $request->input('message');
        $webhookUrl = config('services.n8n.webhook_url'); // Asegúrate que N8N_WEBHOOK_URL está en .env

        if (!$webhookUrl) {
            Log::error('La variable de entorno N8N_WEBHOOK_URL no está definida.');
            return response()->json(['error' => 'Configuración interna del servidor incompleta.'], 500);
        }

        Log::info('Enviando mensaje de texto a n8n: ' . $userMessage);

        // --- Llamada al Webhook n8n (solo con texto) ---
        try {
            $n8nResponse = Http::timeout(60) // Timeout para la respuesta de n8n
                ->post($webhookUrl, [
                    'message' => $userMessage, // Enviar solo el texto
                ]);

            if ($n8nResponse->successful()) {
                $responseData = $n8nResponse->json();
                Log::debug('Respuesta cruda de n8n:', ['raw_body' => $n8nResponse->body()]);
                Log::debug('Respuesta parseada de n8n:', ['parsed_data' => $responseData]);

                // Esperamos una clave 'output' (o la que devuelva tu flujo n8n) con la respuesta de texto
                $aiReplyText = $responseData['output'] ?? null;

                if (!$aiReplyText) {
                    Log::error('La respuesta de n8n no contiene la clave "output" esperada.', ['response_data' => $responseData]);
                    // Devuelve un mensaje genérico
                    return response()->json([
                         'reply' => 'Sorry, I received an unexpected response from the agent.'
                    ], 500); // Internal Server Error o Bad Gateway (502) si prefieres
                }

                Log::info('Respuesta de texto del AI (n8n): ' . $aiReplyText);

                // --- Devolver solo la respuesta de texto al frontend ---
                return response()->json([
                    'reply' => $aiReplyText,
                    // Ya no hay 'audioReply'
                ]);

            } else {
                // Error en la llamada a n8n
                Log::error('Error llamando al webhook de n8n:', [
                    'status' => $n8nResponse->status(),
                    'body' => $n8nResponse->body(),
                    'url' => $webhookUrl,
                    'message_sent' => $userMessage
                ]);
                // Intenta devolver el mensaje de error de n8n si es posible, o uno genérico
                $errorBody = $n8nResponse->json() ?? ['message' => $n8nResponse->body()];
                $errorMessage = $errorBody['message'] ?? 'The AI agent could not respond.';
                return response()->json(['error' => $errorMessage, 'reply' => "Sorry, the AI agent encountered an error."], $n8nResponse->status());
            }

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Error de conexión con el webhook de n8n: ' . $e->getMessage(), ['url' => $webhookUrl]);
            return response()->json(['error' => 'Could not connect to the AI agent.', 'reply' => 'Sorry, I couldn\'t connect to the AI agent right now.'], 504); // Gateway Timeout
        } catch (\Exception $e) {
            Log::error('Error inesperado en ChatController::sendMessage: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'An unexpected error occurred.', 'reply' => 'Sorry, an unexpected error occurred.'], 500); // Internal Server Error
        }
    }
}