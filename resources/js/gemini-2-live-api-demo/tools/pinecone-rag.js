/**
 * PineconeRagTool - Queries Pinecone to find answers about car-related questions
 * This tool uses the Retrieval-Augmented Generation (RAG) pattern to provide
 * relevant information about cars by searching a vector database.
 */

// Load environment variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || localStorage.getItem('PINECONE_API_KEY');
const PINECONE_INDEX = process.env.PINECONE_INDEX || localStorage.getItem('PINECONE_INDEX');
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || localStorage.getItem('PINECONE_NAMESPACE') || 'cars';

export class PineconeRagTool {
    /**
     * Returns the tool declaration for Gemini
     */
    getDeclaration() {
        return {
            name: "carRagSearch",
            description: "Searches for information about car specifications, features, and details using a knowledge base",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The car-related question to answer"
                    }
                },
                required: ["query"]
            }
        };
    }

    /**
     * Gets the Pinecone client
     * @returns {Promise<Object>} Pinecone client
     */
    async getPineconeClient() {
        try {
            const { PineconeClient } = await import('@pinecone-database/pinecone');
            const pinecone = new PineconeClient();
            await pinecone.init({
                apiKey: PINECONE_API_KEY,
                environment: 'gcp-starter' // Default environment, can be configured as needed
            });
            return pinecone;
        } catch (error) {
            console.error('Error initializing Pinecone client:', error);
            throw error;
        }
    }

    /**
     * Gets embeddings for a text query
     * @param {string} text - Text to get embeddings for
     * @returns {Promise<number[]>} Array of embedding values
     */
    async getEmbeddings(text) {
        try {
            console.log('Getting embeddings for:', text);
            
            // In a production environment, you would call an embedding API here
            // For example, using the Google Embeddings API or OpenAI Embeddings API
            
            // This is a placeholder implementation for demonstration purposes
            // When implementing a real solution, replace this with an actual API call
            
            // For a more realistic implementation:
            // 1. Call a text embedding API
            // 2. Process the response and extract the embedding vector
            // 3. Return the embedding vector
            
            // For now, we'll generate a consistent but random vector based on the text
            // This is not suitable for production but provides deterministic results for testing
            const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const pseudoRandom = (a) => Math.sin(a * 12.9898) * 43758.5453 % 1;
            
            return Array.from({ length: 1536 }, (_, i) => {
                // Generate a value between -1 and 1 with some consistency based on input text
                return (pseudoRandom(seed + i) * 2) - 1;
            });
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
    }

    /**
     * Queries Pinecone for matches to the embeddings
     * @param {number[]} embeddings - Vector embeddings to query
     * @param {number} topK - Number of results to return
     * @param {string} namespace - Namespace to query in Pinecone
     * @returns {Promise<Array>} Array of matches with metadata
     */
    async getMatchesFromEmbeddings(embeddings, topK = 5, namespace = PINECONE_NAMESPACE) {
        try {
            // Obtain a client for Pinecone
            const pinecone = await this.getPineconeClient();
            
            // Retrieve the list of indexes
            const indexes = await pinecone.listIndexes();
            
            // Check if the desired index is present, else throw an error
            if (!indexes.includes(PINECONE_INDEX)) {
                throw new Error(`Index ${PINECONE_INDEX} does not exist`);
            }
            
            // Get the Pinecone index
            const index = pinecone.Index(PINECONE_INDEX);
            
            // Define the query request
            const queryRequest = {
                vector: embeddings,
                topK,
                includeMetadata: true,
                namespace,
            };
            
            // Query the index with the defined request
            const queryResult = await index.query({ queryRequest });
            return queryResult.matches || [];
        } catch (error) {
            console.log("Error querying embeddings: ", error);
            throw new Error(`Error querying embeddings: ${error}`);
        }
    }

    /**
     * Formats the search results into a readable response
     * @param {Array} matches - Array of matches from Pinecone
     * @returns {string} - Formatted answer
     */
    formatResponse(matches, query) {
        if (!matches || matches.length === 0) {
            return "I couldn't find any specific information about that car question in my knowledge base.";
        }

        // In a real implementation, matches would contain actual car data
        // Here's a simplified example of formatting the response
        const topResults = matches.slice(0, 3);
        
        // This is simplified - in a real implementation, you would extract 
        // the actual metadata content from the matches
        return `Here's what I found about "${query}":\n\n` +
            topResults.map((match, index) => {
                // In a real implementation, this would use actual metadata
                return `${index + 1}. Match score: ${match.score ? match.score.toFixed(2) : 'N/A'}\n` +
                       `   Context: ${match.metadata ? JSON.stringify(match.metadata) : 'No metadata available'}\n`;
            }).join('\n');
    }

    /**
     * Executes the RAG tool by querying Pinecone with the user's car question
     * @param {Object} args - Arguments passed to the tool
     * @param {string} args.query - The car-related question
     * @returns {Promise<string>} Answer from the knowledge base
     */
    async execute(args) {
        try {
            const { query } = args;
            
            if (!query) {
                throw new Error("Query is required");
            }

            if (!PINECONE_API_KEY || !PINECONE_INDEX) {
                return "Pinecone configuration is incomplete. Please set PINECONE_API_KEY and PINECONE_INDEX in your environment or localStorage.";
            }

            console.log(`Executing car RAG search for query: ${query}`);
            
            // Get embeddings for the query
            const embeddings = await this.getEmbeddings(query);
            
            // Get matches from Pinecone
            const matches = await this.getMatchesFromEmbeddings(embeddings);
            
            // Format the response
            return this.formatResponse(matches, query);
        } catch (error) {
            console.error("Error in RAG search:", error);
            return `Error retrieving car information: ${error.message}`;
        }
    }
}