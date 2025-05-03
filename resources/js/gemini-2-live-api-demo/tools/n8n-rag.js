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
            description: "Searches for information in the car manual, use this tool when the user asks a question about the car",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The question to answer from the PDF document(s)"
                    },
                },
                required: ["query"]
            }
        };
    }

    /**
     * Executes the PDF search by sending PDF content directly to Gemini API
     * @param {Object} args - Arguments passed to the tool
     * @param {string} args.query - The question to answer
     * @param {string} args.pdfPath - Optional path to a specific PDF
     * @returns {Promise<string>} Answer based on PDF content
     */
    async execute(args) {
        try {
            const { query, pdfPath } = args;
            const dataToSend = JSON.stringify({ message: query });
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            };
            const response = await fetch('{{ route("chat.send") }}', {
                method: 'POST',
                headers: headers,
                body: dataToSend // Siempre enviamos JSON
            });
            return response;
            
        } catch (error) {
            console.error("Error in PDF search:", error);
            return `Error searching PDF: ${error.message}`;
        }
    }
}