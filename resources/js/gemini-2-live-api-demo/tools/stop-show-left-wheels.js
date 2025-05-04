/**
 * CarTrunkTool - Triggers the 'open-car-trunk' event to animate the car trunk in AR mode
 */
export class stopShowLeftWheelsTool {
    /**
     * Returns the tool declaration for Gemini
     */
    getDeclaration() {
        return {
            name: "stopShowLeftWheelsTool",
            description: "stop showing in detail the car Left Wheels in AR mode",
        };
    }

    /**
     * Executes the tool by dispatching the 'open-car-trunk' custom event
     * @param {Object} args - Arguments passed to the tool (not used for this tool)
     * @returns {string} - A confirmation message
     */
    execute(args) {
        // Dispatch the custom event to open the car trunk
        const event = new CustomEvent('close_l_wheels');
        document.dispatchEvent(event);
        
        return "I've stopped showing the car Left Wheels for you.";
    }
}