import { GeminiAgent } from '/public/js/main/agent.js';
import { getConfig, getWebsocketUrl, getDeepgramApiKey, MODEL_SAMPLE_RATE } from '/public/js/config/config.js';

import { GoogleSearchTool } from './tools/google-search.js';
import { CarTrunkTool } from './tools/car-trunk.js';
import { CloseCarTrunkTool } from './tools/close-car-trunk.js';
import { openCarRightBackTool } from './tools/car-r-b-door';
import { closeCarRightBackTool } from './tools/close-car-r-b-door';
import { openCarLeftBackTool } from './tools/car-l-b-door.js';
import { closeCarLeftBackTool } from './tools/close-car-l-b-door.js';
import { openCarRightFrontTool } from './tools/car-r-f-door.js';
import { closeCarRightFrontTool } from './tools/close-car-r-f-door.js';
import { openCarLeftFrontTool } from './tools/car-l-f-door.js';
import { closeCarLeftFrontTool } from './tools/close-car-l-f-door.js';
import { openCarChargerTool } from './tools/car-charger.js';
import { openCarRoofTool } from './tools/car-roof.js';
import { closeCarRoofTool } from './tools/close-car-roof.js';
import { openCarRightWheelsTool } from './tools/right-wheels.js';
import { openCarLeftWheelsTool } from './tools/left-wheels.js';
import { learnTool } from './tools/charging-tutorial.js';
import { stopShowLeftWheelsTool } from './tools/stop-show-left-wheels.js';
import { stopShowRightWheelsTool } from './tools/stop-show-right-wheels.js';


// import { PineconeRagTool } from './tools/pinecone-rag.js';
// import { PdfRagTool } from './tools/pdf-rag.js';
import { PdfRagTool } from './tools/n8n-rag.js';
import { ToolManager } from './tools/tool-manager.js';
import { ChatManager } from '/public/js/chat/chat-manager.js';

import { setupEventListeners } from '/public/js/dom/events.js';

const url = getWebsocketUrl();
const config = getConfig();
const deepgramApiKey = getDeepgramApiKey();

const toolManager = new ToolManager();
toolManager.registerTool('googleSearch', new GoogleSearchTool());
toolManager.registerTool('openCarTrunk', new CarTrunkTool());
toolManager.registerTool('closeCarTrunk', new CloseCarTrunkTool());
// toolManager.registerTool('carRagSearch', new PineconeRagTool());
toolManager.registerTool('pdfSearch', new PdfRagTool());
toolManager.registerTool('openCarRightBack', new openCarRightBackTool());
toolManager.registerTool('closeCarRightBack', new closeCarRightBackTool());
toolManager.registerTool('openCarLeftBack', new openCarLeftBackTool());
toolManager.registerTool('closeCarLeftBack', new closeCarLeftBackTool());
toolManager.registerTool('openCarRightFront', new openCarRightFrontTool());
toolManager.registerTool('closeCarRightFront', new closeCarRightFrontTool());
toolManager.registerTool('openCarLeftFront', new openCarLeftFrontTool());
toolManager.registerTool('closeCarLeftFront', new closeCarLeftFrontTool());
toolManager.registerTool('openCarChargerTool', new openCarChargerTool());
toolManager.registerTool('openCarRoofTool', new openCarRoofTool());
toolManager.registerTool('closeCarRoofTool', new closeCarRoofTool());
toolManager.registerTool('openCarRightWheelTool', new openCarRightWheelsTool());
toolManager.registerTool('openCarLeftWheelsTool', new openCarLeftWheelsTool());
toolManager.registerTool('learnTool', new learnTool());
toolManager.registerTool('stopShowRightWheelsTool', new stopShowRightWheelsTool());
toolManager.registerTool('stopShowLeftWheelsTool', new stopShowLeftWheelsTool());

const chatManager = new ChatManager();

const geminiAgent = new GeminiAgent({
    url,
    config,
    deepgramApiKey,
    modelSampleRate: MODEL_SAMPLE_RATE,
    toolManager
});

// Handle chat-related events
geminiAgent.on('transcription', (transcript) => {
    chatManager.updateStreamingMessage(transcript);
});

geminiAgent.on('text_sent', (text) => {
    chatManager.finalizeStreamingMessage();
    chatManager.addUserMessage(text);
});

geminiAgent.on('interrupted', () => {
    chatManager.finalizeStreamingMessage();
    if (!chatManager.lastUserMessageType) {
        chatManager.addUserAudioMessage();
    }
});

geminiAgent.on('turn_complete', () => {
    chatManager.finalizeStreamingMessage();
});

geminiAgent.connect();

setupEventListeners(geminiAgent);