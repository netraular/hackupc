<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <!-- Ensures proper rendering and touch zooming capabilities on mobile devices -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <!-- CSRF Token (If using Laravel) -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>AR Experience with Chat</title>

    <!-- Import map for Three.js -->
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
        }
    </script>

    <!-- Styles for the application -->
    <style>
        /* --- Variables and Reset --- */
        :root {
            --bg-color: #1a1a1a;
            --ui-bg: #2d2d2d;
            --ui-hover: #3d3d3d;
            --text-color: #ffffff;
            --accent-color: #4CAF50; /* Green */
            --danger-color: #ff4444; /* Red */
            --info-bg: rgba(0, 0, 0, 0.7); /* Darker info background */
            --button-padding: 10px 15px;
            --button-radius: 6px;
            --ui-z-index: 10;
            --ar-overlay-z-index: 1; /* Base AR overlay (touch capture) */
            --ar-button-z-index: 5; /* Buttons inside AR overlay (close, animation) */
            --ar-start-button-z-index: 100; /* Initial 'Start AR' button */
            --ar-info-z-index: 90;
            --error-z-index: 1001;
            --settings-z-index: 1000;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            /* Improves font rendering */
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        html {
            height: 100%;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            /* Ensure full height and prevent scrolling/pull-to-refresh */
            height: 100%;
            width: 100%;
            overflow: hidden;
            position: fixed; /* Prevents pull-to-refresh issues on mobile */
        }

        /* Default Three.js canvas (if created) should be behind UI */
        canvas#three-canvas { /* Give your main canvas an ID if needed */
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }

        /* --- Main App UI (Non-AR) --- */
        #app-ui {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex; /* Use flex for main layout */
            flex-direction: column; /* Stack elements vertically */
            z-index: var(--ui-z-index);
            /* Initially visible, fades out in AR mode */
            opacity: 1;
            visibility: visible;
            transition: opacity 0.4s ease, visibility 0.4s ease;
            pointer-events: auto; /* Enable interactions */
        }

        .ui-button {
            background-color: var(--ui-bg);
            color: var(--text-color);
            border: 1px solid rgba(255, 255, 255, 0.3); /* Softer border */
            border-radius: var(--button-radius);
            padding: var(--button-padding);
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.2s ease, transform 0.1s ease, border-color 0.2s ease;
            position: absolute; /* Positioned within #app-ui */
            z-index: calc(var(--ui-z-index) + 2); /* Above chat/visualizer */
            -webkit-tap-highlight-color: transparent; /* Remove tap highlight */
        }

        .ui-button:hover {
            background-color: var(--ui-hover);
            border-color: rgba(255, 255, 255, 0.5);
        }
        .ui-button:active {
            transform: scale(0.96); /* Slightly more noticeable press */
        }

        .top-left { top: 15px; left: 15px; }
        .top-right { top: 15px; right: 15px; }

        .ui-button.accent { border-color: var(--accent-color); color: var(--accent-color); }
        .ui-button.danger { border-color: var(--danger-color); color: var(--danger-color); }
        .ui-button.accent:hover { background-color: var(--accent-color); color: var(--text-color); }
        .ui-button.danger:hover { background-color: var(--danger-color); color: var(--text-color); }

        .settings-icon { padding: 8px 12px; font-size: 18px; }
        .send-icon { font-size: 18px; width: 45px; text-align: center; padding: 10px 0; }
        .mic-icon { font-size: 18px; width: 45px; text-align: center; padding: 10px 0; }
        .mic-icon.active { background-color: var(--danger-color); border-color: var(--danger-color); color: var(--text-color); } /* Example active state */

        .chat-history-area {
            /* Take up space between top buttons and bottom area */
            flex-grow: 1;
            margin: 60px 15px 130px 15px; /* Top, R, Bottom, L margins */
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            padding: 15px;
            overflow-y: auto; /* Enable scrolling for chat messages */
            display: flex;
            flex-direction: column;
            gap: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: var(--ui-z-index);
            /* Smooth scrolling on touch devices */
            -webkit-overflow-scrolling: touch;
        }

        /* Chat message styling */
        .chat-message { padding: 10px 15px; border-radius: 15px; max-width: 80%; word-wrap: break-word; line-height: 1.4; }
        .user-message { background: #2c5282; color: white; align-self: flex-end; margin-left: 20%; border-bottom-right-radius: 5px; }
        .model-message { background: #3f4a5c; color: white; align-self: flex-start; margin-right: 20%; border-bottom-left-radius: 5px; }
        .model-message.streaming::after { content: '▋'; display: inline-block; animation: blink 1s step-end infinite; margin-left: 3px; vertical-align: baseline; }
        @keyframes blink { 50% { opacity: 0; } }

        .audio-visualizer {
            position: absolute;
            bottom: 65px; /* Position above bottom controls */
            left: 0;
            width: 100%;
            height: 60px; /* Height of the visualizer */
            z-index: var(--ui-z-index);
            pointer-events: none; /* Allow clicks through */
        }

        .bottom-controls {
            position: absolute;
            bottom: 10px;
            left: 15px;
            right: 15px;
            height: 45px; /* Consistent height for input/buttons */
            display: flex;
            align-items: center; /* Vertically align items */
            gap: 10px;
            z-index: calc(var(--ui-z-index) + 1);
        }

        .text-input-field {
            flex-grow: 1; /* Take remaining horizontal space */
            height: 100%;
            padding: 10px 15px;
            border-radius: var(--button-radius);
            border: 1px solid var(--accent-color);
            background-color: var(--ui-bg);
            color: var(--text-color);
            font-size: 16px;
            outline: none;
        }
        .text-input-field:focus {
            box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
        }

        /* Ensure bottom buttons don't have absolute positioning here */
        .bottom-controls .ui-button {
            position: relative; /* Override absolute positioning from .ui-button */
            width: 45px; /* Fixed width */
            height: 100%;
            flex-shrink: 0; /* Prevent shrinking */
            padding: 0; /* Reset padding */
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* --- AR Mode Specific Styles --- */

        /* Container for the initial 'Start AR' button */
        #ar-button-container {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: var(--ar-start-button-z-index);
            opacity: 1;
            visibility: visible;
            transition: opacity 0.4s ease, visibility 0.4s ease;
            pointer-events: auto;
        }
        /* Style the button generated *by* ARButton.js */
        #ar-button-container button#ARButton {
            padding: 12px 24px;
            border: 1px solid #fff;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.6); /* Slightly darker */
            color: #fff;
            font: bold 1.1em sans-serif; /* Bolder font */
            cursor: pointer;
            transition: background-color 0.2s ease;
            -webkit-tap-highlight-color: transparent;
        }
        #ar-button-container button#ARButton:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        /* AR Info Panel (Shown temporarily at session start) */
        #ar-info-panel {
            position: absolute;
            top: 15px; /* Align with other top buttons */
            left: 50%;
            transform: translateX(-50%);
            width: max-content; /* Fit content */
            max-width: 90%; /* Prevent overflow */
            text-align: center;
            z-index: var(--ar-info-z-index);
            color: white;
            background-color: var(--info-bg);
            padding: 8px 15px;
            font-family: sans-serif;
            font-size: 0.9em;
            border-radius: 4px;
            display: none; /* Hidden by default, shown via .ar-active */
            pointer-events: none; /* Don't block interactions */
            opacity: 0;
            transition: opacity 0.4s ease 0.2s; /* Fade in slightly delayed */
        }

        /* Styles for buttons CREATED BY YOUR JS inside the AR Overlay */
        /* Example for the animation button */
        button#animation1 {
            /* Styles mostly applied in JS, ensure z-index is correct */
            z-index: var(--ar-button-z-index) !important; /* Ensure it's above overlay */
            position: absolute; /* Needed if not set in JS */
            top: 20px;
            left: 20px;
            /* Add any other styles not covered in JS */
             -webkit-tap-highlight-color: transparent;
        }
        /* Example targeting the default close button (SVG) created by ARButton.js */
        /* This selector might be fragile, depends on ARButton.js output */
        div[style*="display: block;"] > svg[width="38"] { /* Target overlay's SVG */
            position: absolute !important; /* ARButton might use inline styles */
            top: 15px !important;
            right: 15px !important;
            z-index: var(--ar-button-z-index) !important; /* Ensure it's above overlay */
            cursor: pointer;
             -webkit-tap-highlight-color: transparent;
        }


        /* --- State Change: When AR is Active --- */
        body.ar-active #app-ui {
            opacity: 0;
            visibility: hidden; /* Hide completely */
            pointer-events: none; /* Disable interaction */
        }

        body.ar-active #ar-button-container {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            /* The actual 'STOP AR' button is inside the AR overlay now */
        }

        /* Show AR info panel when AR starts */
        body.ar-active #ar-info-panel {
            display: block; /* Make it visible */
            opacity: 1;
        }


        /* --- Error Message Styling --- */
        .ar-error-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(220, 53, 69, 0.9); /* Bootstrap danger-like */
            color: white;
            padding: 20px 25px;
            border: 1px solid var(--danger-color);
            border-radius: 5px;
            font-family: sans-serif;
            text-align: center;
            z-index: var(--error-z-index);
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            max-width: 85%;
            font-size: 0.95em;
            line-height: 1.5;
        }
        .ar-error-message a {
            color: #ffdddd;
            text-decoration: underline;
            font-weight: bold;
        }


        /* --- Settings Dialog Styling (Optional) --- */
        .settings-overlay {
            display: none; /* Controlled by JS */
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: rgba(0, 0, 0, 0.7); /* Darker overlay */
            z-index: calc(var(--settings-z-index) - 1);
        }
        .settings-dialog {
            display: none; /* Controlled by JS */
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background-color: var(--ui-bg);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 25px;
            width: 90%;
            max-width: 450px;
            max-height: 85vh;
            overflow-y: auto;
            z-index: var(--settings-z-index);
            box-shadow: 0 5px 20px rgba(0,0,0,0.4);
        }
        
        /* Add rules for active class to show dialog */
        .settings-overlay.active {
            display: block;
        }
        .settings-dialog.active {
            display: block;
        }
        
        /* Style settings groups */
        .settings-group {
            margin-bottom: 15px;
        }
        .settings-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .settings-group select {
            width: 100%;
            padding: 8px;
            background-color: var(--ui-bg);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            color: var(--text-color);
        }
        /* Add other .settings-* styles here if using the dialog */


        /* --- Responsiveness --- */
        @media screen and (max-width: 400px) {
            .ui-button {
                padding: 8px 12px;
                font-size: 14px;
            }
            .bottom-controls {
                gap: 8px; /* Slightly reduce gap */
                left: 10px;
                right: 10px;
            }
            .text-input-field {
                font-size: 15px; /* Slightly smaller font */
            }
            
            #ar-info-panel {
                 font-size: 0.85em;
            }
        }

    </style>

    <!-- Load AR Experience Script (make sure it contains all the logic) -->
    @vite('resources/js/ar/ar_experience.js')

</head>
<body>

    <!-- Main App Container (Hidden during AR) -->
    <div id="app-ui">
        <button id="disconnectBtn" class="ui-button top-left danger">Disconnect</button>
        <button id="connectBtn" class="ui-button top-left accent" style="display: none;">Connect</button>
        <button id="settingsBtn" class="ui-button top-right settings-icon">⚙️</button>

        <!-- Chat History Area -->

        <!-- Audio Visualizer Canvas -->
        <canvas id="visualizer" class="audio-visualizer"></canvas>

        <!-- Bottom Input/Controls Area -->
        <div class="bottom-controls">
            <!-- <input type="text" id="messageInput" placeholder="Type message..." class="text-input-field"> -->
            <!-- <button id="sendBtn" class="ui-button send-icon">➤</button> -->
            <button id="micBtn" class="ui-button mic-icon">🎤</button>
        </div>
    </div>

    <!-- AR Specific Elements -->
    <!-- Container for the initial AR Button generated by ARButton.js -->
    <div id="ar-button-container"></div>

    <!-- Info panel shown at the start of AR session -->
    <div id="ar-info-panel">Point at a surface, then tap to place the object</div>

    <!-- Error messages related to AR support/permissions will be appended here by ARButton.js -->
    <!-- (Styled by .ar-error-message) -->


    <!-- Optional Settings Dialog Structure (Uncomment if needed) -->
    
    <div class="settings-overlay"></div>
    <div class="settings-dialog">
        <h2>Settings</h2>
        <div class="settings-group">
            <label for="microphoneSelect">Microphone</label>
            <select id="microphoneSelect"></select>
        </div>
        <div class="settings-group">
            <label for="speakerSelect">Speaker</label>
            <select id="speakerSelect"></select>
        </div>
        <button class="settings-save-btn ui-button accent" style="position:relative; width:100%; margin-top:20px;">Save Settings</button>
    </div>
   

    <!-- Load other scripts like the Gemini Chat script -->
    @vite('resources/js/gemini-2-live-api-demo/script.js')

</body>
</html>