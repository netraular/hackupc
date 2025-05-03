<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http; // Importa el cliente HTTP de Laravel
use Illuminate\Support\Facades\Log;  // Para registrar errores (opcional pero útil)

class ChatController extends Controller
{
    /**
     * Muestra la vista del chat.
     */
    public function index()
    {
        return view('chat'); // Crearemos esta vista en el siguiente paso
    }

    /**
     * Recibe el mensaje del usuario, lo envía al webhook de n8n y devuelve la respuesta.
     */
    public function sendMessage(Request $request)
    {

        // Validación simple
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $userMessage = $request->input('message');
        // --- IMPORTANTE: Guarda esta URL en tu .env para mayor seguridad y flexibilidad ---
        // $webhookUrl = env('N8N_WEBHOOK_URL', 'TU_URL_POR_DEFECTO_SI_NO_ESTA_EN_ENV');
        $webhookUrl = 'https://n8n.raular.com/webhook/91ccfc7f-5bcf-467d-b64e-5a5d86733588'; // Usa la variable de entorno
        if (!$webhookUrl) {
            Log::error('La variable de entorno N8N_WEBHOOK_URL no está definida.');
            // ESTA LÍNEA ES LA QUE GENERA TU ERROR
            return response()->json(['error' => 'AAAAAAAAAConfiguración interna del servidor incompleta.'], 500);
        }

        try {
            // Realiza la petición POST al webhook de n8n
            $response = Http::timeout(30) // Establece un timeout (ej. 30 segundos)
                ->post($webhookUrl, [
                // --- Asegúrate que tu workflow n8n espera recibir 'message' en el body ---
                // --- o ajusta esta clave según necesites ('text', 'input', etc.) ---
                'message' => $userMessage,
                // Puedes añadir aquí otros datos si tu workflow los necesita
                // 'userId' => auth()->id(), // Ejemplo si el usuario está logueado
            ]);

            // Verifica si la petición fue exitosa (código 2xx)
            if ($response->successful()) {

                $responseData = $response->json();

                // --- LOGS ADICIONALES ---
                Log::debug('Respuesta JSON cruda de n8n:', ['raw_body' => $response->body()]); // Ver el JSON exacto
                Log::debug('Respuesta parseada a array PHP:', ['parsed_data' => $responseData]); // Verificar el array
                Log::debug('Intentando acceder a [data][output]:', [
                    'has_data' => isset($responseData['data']),
                    'has_output' => isset($responseData['data']['output']),
                    'value' => $responseData['data']['output'] ?? 'NO ENCONTRADO o NULL'
                ]);
                // -----------------------
        
                $aiReply = $responseData['output'] ?? 'Error: No se pudo interpretar la respuesta del agente.';
        
                // --- LOG ADICIONAL ---
                Log::debug('Valor final de $aiReply antes de enviar JSON:', ['aiReply_value' => $aiReply]);
                // -----------------------
                // Devuelve la respuesta del AI como JSON al frontend
                return response()->json(['reply' => $aiReply]);

            } else {
                // La petición falló (código 4xx o 5xx)
                Log::error('Error llamando al webhook de n8n:', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'url' => $webhookUrl,
                    'message_sent' => $userMessage
                ]);
                // Devuelve un error genérico al frontend
                return response()->json(['error' => 'El agente IA no pudo responder.'], $response->status());
            }

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Error de conexión con el webhook de n8n: ' . $e->getMessage(), ['url' => $webhookUrl]);
            return response()->json(['error' => 'No se pudo conectar con el agente IA.'], 504); // Gateway Timeout
        } catch (\Exception $e) {
            // Captura cualquier otro error inesperado
            Log::error('Error inesperado en ChatController::sendMessage: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Ocurrió un error inesperado.'], 500); // Internal Server Error
        }
    }
}