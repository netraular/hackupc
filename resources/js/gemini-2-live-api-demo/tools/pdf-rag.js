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
    constructor() {
        // Keep track of loaded PDFs
        this.loadedPdfs = JSON.parse(localStorage.getItem('loadedPdfs')) || [];
        
        // Initialize the Google GenAI client
        this.genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        
        // Default model to use
        this.model = "gemini-2.0-flash";
    }

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
     * Fetches a PDF document and converts it to base64
     * @returns {Promise<string>} Base64-encoded PDF content
     */
    async fetchPdfAsBase64(pdfPath) {
        try {
            // Fetch the PDF file
            const response = await fetch(pdfPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            }
            
            // Get the array buffer from the response
            const arrayBuffer = await response.arrayBuffer();
            
            // Convert the array buffer to base64 using our utility function
            return arrayBufferToBase64(arrayBuffer);
        } catch (error) {
            console.error("Error fetching PDF:", error);
            throw error;
        }
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
            
            if (!query) {
                throw new Error("Query is required");
            }

            if (!GEMINI_API_KEY) {
                throw new Error("Gemini API key is not set. Please set it in your settings.");
            }

            console.log(`Executing PDF search for query: ${query}`);
            
            // Initialize default PDF if none specified
            const pdfPathToSearch = '/files/manual.pdf'; // Updated path to use public directory
            
            // Fetch the PDF as base64
            const pdfBase64 = await this.fetchPdfAsBase64(pdfPathToSearch);
            
            // Create the model request
            const model = this.genAI.models.getGenerativeModel({ model: this.model });
            
            // Create the contents array with the query and PDF data
            const contents = [
                { text: query },
                {
                    inlineData: {
                        mimeType: 'application/pdf',
                        data: pdfBase64
                    }
                }
            ];
            
            // Generate content using Gemini API
            const response = await model.generateContent({
                contents: contents,
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 4096,
                }
            });
            
            // Return the generated response
            return response.response.text();
            
        } catch (error) {
            console.error("Error in PDF search:", error);
            return `Error searching PDF: ${error.message}`;
        }
    }
}