/**
 * PdfRagTool - Queries PDF documents using Gemini's document understanding capabilities
 * This tool sends PDF documents directly to Gemini's API for processing
 */

import { GoogleGenAI } from "@google/genai";
// Remove fs import as it's not available in browsers
import { arrayBufferToBase64 } from '/public/js/utils/utils.js';

// Load environment variables
const GEMINI_API_KEY = localStorage.getItem('apiKey');

export class PdfRagTool {

    /**
     * Returns the tool declaration for Gemini
     */
    getDeclaration() {
        return {
            name: "pdfSearch",
            description: "Searches the car's user manual PDF to provide accurate, manual-based answers to user questions about the vehicle’s features, functions, and usage. Use this tool whenever a user asks how something works or how to operate, configure, or locate a component in the car. If the query also suggests an action (e.g., 'Open the trunk'), first respond with instructions from the manual, and then attempt to perform the action if system capabilities allow it.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The user's question or request about using or understanding the car, requiring an answer based on the manual (e.g., 'How do I enable cruise control?')."
                    },
                    context: {
                        type: "string",
                        description: "(Optional) Additional context about the user’s situation or car model to refine the search.",
                        default: ""
                    }
                },
                required: ["query"]
            }
        };
    }
    // 
        
    // getDeclaration() {
    //     return {
    //         name: "pdfSearch",
    //         description: "Searches for information in the car manual, use this tool when the user asks a question about the car",
    //         parameters: {
    //             type: "object",
    //             properties: {
    //                 query: {
    //                     type: "string",
    //                     description: "The question to answer from the PDF document(s)"
    //                 },
    //             },
    //             required: ["query"]
    //         }
    //     };
    // }
    

    /**
     * Executes the PDF search by sending PDF content directly to Gemini API
     * @param {Object} args - Arguments passed to the tool
     * @param {string} args.query - The question to answer
     * @param {string} args.pdfPath - Optional path to a specific PDF
     * @returns {Promise<string>} Answer based on PDF content
     */
    async execute(args) {
        try {
            const { query } = args;
            const dataToSend = JSON.stringify({ message: query });
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            };
            const response = await fetch('/chat/send', {
                method: 'POST',
                headers: headers,
                body: dataToSend // Siempre enviamos JSON
            });
            const jsonResponse = await response.json();
            return jsonResponse.reply;
            
        } catch (error) {
            console.error("Error in PDF search:", error);
            return `Error searching PDF: ${error.message}`;
        }
    }
}