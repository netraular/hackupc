# transcribe_audio.py
import argparse
import sys
import os
from google.cloud.speech_v2 import SpeechClient
from google.cloud.speech_v2.types import RecognizeRequest
from google.api_core.exceptions import GoogleAPICallError, NotFound

def transcribe(audio_path, project_id, location='global', recognizer_id='_'):
    """
    Transcribe the given audio file using Google Cloud Speech V2 API.

    Args:
        audio_path (str): Path to the audio file.
        project_id (str): Your Google Cloud project ID.
        location (str): The location for the recognizer (e.g., 'global', 'us-central1').
        recognizer_id (str): The ID of the recognizer to use (default: '_').

    Returns:
        str: The transcription text, or None if an error occurs.
    """
    try:
        # Check if the audio file exists
        if not os.path.exists(audio_path):
            print(f"Error: Audio file not found at {audio_path}", file=sys.stderr)
            return None

        # Instantiates a client
        # Assumes GOOGLE_APPLICATION_CREDENTIALS environment variable is set
        # or application default credentials are configured.
        client = SpeechClient()

        # Reads the audio file into memory
        with open(audio_path, "rb") as audio_file:
            content = audio_file.read()

        # The full resource name of the recognizer
        recognizer_name = f"projects/{project_id}/locations/{location}/recognizers/{recognizer_id}"

        # Configure the recognition request
        # You might need to adjust languageCodes, model etc. based on your needs
        config = {
             "auto_decoding_config": {}, # Use default decoding config
             "language_codes": ["es-ES"], # Set language to Spanish (Spain)
             "model": "latest_long",      # Use the latest long-form model
             # Add other configuration options if needed, like explicit_decoding_config
             # "features": {"enable_automatic_punctuation": True} # Example feature
        }


        request = RecognizeRequest(
            recognizer=recognizer_name,
            config=config,
            content=content,
        )

        # Performs speech recognition
        response = client.recognize(request=request)

        # Process the results
        transcription = ""
        if response.results:
             for result in response.results:
                 if result.alternatives:
                     transcription += result.alternatives[0].transcript + " "
        else:
            # Handle cases where no transcription results are returned
             print("Warning: No transcription results returned by the API.", file=sys.stderr)


        return transcription.strip()

    except FileNotFoundError:
         print(f"Error: Audio file not found at {audio_path}", file=sys.stderr)
         return None
    except GoogleAPICallError as e:
        print(f"Error during Google API call: {e}", file=sys.stderr)
        # Check for common issues like incorrect recognizer name
        if isinstance(e, NotFound):
            print(f"Hint: Check if the recognizer '{recognizer_name}' exists or if the location '{location}' is correct.", file=sys.stderr)
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Transcribe an audio file using Google Cloud Speech V2.')
    parser.add_argument('audio_file', help='Path to the audio file (e.g., WAV, MP3).')
    parser.add_argument('--project-id', required=True, help='Your Google Cloud Project ID.')
    # Add optional arguments for location and recognizer_id if needed
    # parser.add_argument('--location', default='global', help='Recognizer location.')
    # parser.add_argument('--recognizer-id', default='_', help='Recognizer ID.')


    args = parser.parse_args()

    # Ensure GOOGLE_APPLICATION_CREDENTIALS is set or ADC is configured
    if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
         print("Warning: GOOGLE_APPLICATION_CREDENTIALS environment variable not set. "
               "Attempting to use Application Default Credentials (ADC).", file=sys.stderr)
         # Consider adding more robust credential checking if needed

    # transcription = transcribe(args.audio_file, args.project_id, args.location, args.recognizer_id)
    transcription = transcribe(args.audio_file, args.project_id)


    if transcription is not None:
        # CRITICAL: Print ONLY the transcription to stdout for Laravel to capture
        print(transcription)
        sys.exit(0) # Exit with success code
    else:
        # Error messages were already printed to stderr
        sys.exit(1) # Exit with error code