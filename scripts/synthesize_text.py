# synthesize_text.py
import argparse
import sys
import os
from google.cloud import texttospeech_v1 as texttospeech
from google.api_core.exceptions import GoogleAPICallError

def synthesize(text, project_id, language_code='es-ES', voice_name='es-ES-Standard-A', output_encoding_str='MP3'):
    """
    Sintetiza el texto dado a audio usando Google Cloud Text-to-Speech API.

    Args:
        text (str): El texto a sintetizar.
        project_id (str): Tu Google Cloud project ID (no usado directamente por la librería si las credenciales están bien, pero bueno tenerlo para contexto/futuro).
        language_code (str): Código de idioma BCP-47 (e.g., 'es-ES', 'en-US').
        voice_name (str): Nombre específico de la voz (e.g., 'es-ES-Standard-A', 'en-US-Wavenet-D').
        output_encoding_str (str): Formato de salida ('MP3', 'LINEAR16', 'OGG_OPUS').

    Returns:
        bytes: Los bytes del contenido de audio, o None si hay error.
    """
    try:
        # Instancia el cliente. Asume que GOOGLE_APPLICATION_CREDENTIALS está configurada.
        client = texttospeech.TextToSpeechClient()

        # Configura el texto de entrada
        synthesis_input = texttospeech.SynthesisInput(text=text)

        # Configura los parámetros de voz
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code, name=voice_name
        )

        # Selecciona el tipo de codificación de audio
        try:
            # Mapea el string de entrada a la enumeración correcta
            audio_encoding_enum = getattr(texttospeech.AudioEncoding, output_encoding_str.upper())
        except AttributeError:
            print(f"Error: Codificación de audio inválida '{output_encoding_str}'. Usar MP3, LINEAR16, OGG_OPUS.", file=sys.stderr)
            return None

        audio_config = texttospeech.AudioConfig(
            audio_encoding=audio_encoding_enum
            # Puedes añadir otros parámetros aquí como speaking_rate, pitch si los necesitas
        )

        # Realiza la solicitud de síntesis de texto a voz
        print(f"Debug Python: Enviando texto a TTS API (Lang: {language_code}, Voice: {voice_name}, Encoding: {output_encoding_str})...", file=sys.stderr)
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        print("Debug Python: Respuesta recibida de TTS API.", file=sys.stderr)

        # La respuesta contiene el contenido de audio binario
        return response.audio_content

    except GoogleAPICallError as e:
        print(f"Error durante la llamada a Google TTS API: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Un error inesperado ocurrió en Python: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Sintetiza texto a audio usando Google Cloud TTS.')
    parser.add_argument('text', help='El texto a sintetizar.')
    parser.add_argument('--project-id', required=True, help='Tu Google Cloud Project ID.')
    parser.add_argument('--language-code', default='es-ES', help='Código de idioma (e.g., es-ES, en-US).')
    parser.add_argument('--voice-name', default='es-ES-Standard-A', help='Nombre de la voz (e.g., es-ES-Standard-A).')
    parser.add_argument('--output-encoding', default='MP3', choices=['MP3', 'LINEAR16', 'OGG_OPUS'], help='Formato de salida de audio.')

    args = parser.parse_args()

    # Verificar credenciales (igual que en STT)
    if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
         print("Warning Python: Variable de entorno GOOGLE_APPLICATION_CREDENTIALS no encontrada. Intentando usar ADC.", file=sys.stderr)

    # Llamar a la función de síntesis
    audio_bytes = synthesize(
        args.text,
        args.project_id,
        args.language_code,
        args.voice_name,
        args.output_encoding
    )

    if audio_bytes:
        # CRÍTICO: Escribir los bytes de audio CRUDOS a stdout
        # Usamos sys.stdout.buffer para escribir datos binarios
        try:
             sys.stdout.buffer.write(audio_bytes)
             sys.stdout.buffer.flush() # Asegurarse de que se escriba todo
             sys.exit(0) # Éxito
        except Exception as e:
             print(f"Error escribiendo audio bytes a stdout: {e}", file=sys.stderr)
             sys.exit(1) # Error de escritura
    else:
        # Los errores ya se imprimieron a stderr en la función synthesize
        sys.exit(1) # Error