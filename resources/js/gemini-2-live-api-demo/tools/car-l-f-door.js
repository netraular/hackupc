/**
 * CarTrunkTool - Triggers the 'open-car-trunk' event to animate the car trunk in AR mode
 */
export class openCarLeftFrontTool {
    /**
     * Returns the tool declaration for Gemini
     */
    getDeclaration() {
        return {
            name: "openCarLeftFront",
            description: "Opens the car Left Front door in AR mode",
        };
    }

    /**
     * Executes the tool by dispatching the 'open-car-trunk' custom event
     * @param {Object} args - Arguments passed to the tool (not used for this tool)
     * @returns {string} - A confirmation message
     */
    execute(args) {
        // Dispatch the custom event to open the car trunk
        const event = new CustomEvent('open_l_f_door');
        document.dispatchEvent(event);
        
        console.log('Car trunk event dispatched by Gemini');
        return "I've opened the car Left Front door for you. Take a look in AR mode!";
    }
}