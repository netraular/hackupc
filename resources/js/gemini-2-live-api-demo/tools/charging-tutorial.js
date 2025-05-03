/**
 * CarTrunkTool - Triggers the 'open-car-trunk' event to animate the car trunk in AR mode
 */
export class explainChargingTool {
    /**
     * Returns the tool declaration for Gemini
     */
    getDeclaration() {
        return {
            name: "explainChargingTool",
            description: "Explain how charging works",
        };
    }

    /**
     * Executes the tool by dispatching the 'open-car-trunk' custom event
     * @param {Object} args - Arguments passed to the tool (not used for this tool)
     * @returns {string} - A confirmation message
     */
    execute(args) {
        // Dispatch the custom event to open the car trunk
        const event = new CustomEvent('open-charger');
        document.dispatchEvent(event);
        
        return "Sure thing! You can charge your CUPRA using either AC or DC power. For AC charging, you typically use a home or public charging station, or even a household socket with the right cable. For faster DC charging, you'll use a public fast-charging station.\n\nTo start charging, make sure the car is off, then open the charging socket cover. Connect the charging cable first to the power source (socket or station), then plug it into the car's charging socket. The connector locks automatically, and an indicator light will show the charging is active. The charging process usually starts right away unless you have programmed charging times set in the infotainment system. You might need to authenticate at public stations.\n\nTo stop charging, you can unlock the vehicle or use the \"Stop charging\" function in the infotainment system. The light next to the socket will turn white, and you can then unplug the cable. There's also a setting to automatically release the connector when charging is done. The manual also mentions various settings you can adjust in the infotainment system, like setting minimum and maximum charging levels.\n\nRemember to always follow the safety instructions in the manual and make sure the cable and power source are in good condition.";
    }
}