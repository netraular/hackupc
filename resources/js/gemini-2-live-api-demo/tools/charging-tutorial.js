/**
 * explainChargingTool - Triggers the 'open-charger' event and provides different tutorials
 */
export class explainChargingTool {
    // Define available tutorials
    #tutorials = {
        charging: "Sure thing! You can charge your CUPRA using either AC or DC power. For AC charging, you typically use a home or public charging station, or even a household socket with the right cable. For faster DC charging, you'll use a public fast-charging station.\n\nTo start charging, make sure the car is off, then open the charging socket cover. Connect the charging cable first to the power source (socket or station), then plug it into the car's charging socket. The connector locks automatically, and an indicator light will show the charging is active. The charging process usually starts right away unless you have programmed charging times set in the infotainment system. You might need to authenticate at public stations.\n\nTo stop charging, you can unlock the vehicle or use the \"Stop charging\" function in the infotainment system. The light next to the socket will turn white, and you can then unplug the cable. There's also a setting to automatically release the connector when charging is done. The manual also mentions various settings you can adjust in the infotainment system, like setting minimum and maximum charging levels.\n\nRemember to always follow the safety instructions in the manual and make sure the cable and power source are in good condition.",
        doors: "Sure thing! To open the doors from the outside, you first unlock the car, then just grab the door handle and press the interior surface of it.\n\nFrom the inside, you pull the door handle to a point of resistance and push the door open. If the car was locked from the outside without the \"Safe\" system active, you might need to pull the inside handle twice to open it.\n\nThere's also a mechanical way to open the door in an emergency, like if the battery is flat, by pulling the door handle firmly."
    }

    /**
     * Returns the tool declaration for Gemini
     */
    getDeclaration() {
        return {
            name: "explainChargingTool",
            description: "You objective is to teach the owner to use their car. Use these information to guide the owner.",
            parameters: {
                type: "object",
                properties: {
                    tutorial: {
                        type: "string",
                        enum: ["charging", "doors"],
                        description: "Type of information to tell the user about (charging or doors)"
                    }
                },
                required: []
            }
        };
    }

    /**
     * Executes the tool by dispatching the 'open-charger' custom event and returning a tutorial
     * @param {Object} args - Arguments passed to the tool
     * @param {string} [args.tutorial="charging"] - The type of tutorial to display
     * @returns {string} - The tutorial text
     */
    execute(args) {
        // Dispatch the custom event to open the charger
        if (args?.tutorial === "charging") {
            const event = new CustomEvent('open-charger');
            document.dispatchEvent(event);
        } else {
            document.dispatchEvent(new CustomEvent('open_r_f_door'));
            document.dispatchEvent(new CustomEvent('open_l_f_door'));
            // wait 4 seconds
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('open_r_b_door'));
                document.dispatchEvent(new CustomEvent('open_l_b_door'));
                // wait 4 seconds
                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('close_r_b_door'));
                    document.dispatchEvent(new CustomEvent('close_l_b_door'));
                    // wait 4 seconds
                    setTimeout(() => {
                        document.dispatchEvent(new CustomEvent('close_r_f_door'));
                        document.dispatchEvent(new CustomEvent('close_l_f_door'));
                    }, 6000);
                }, 6000);
            }, 6000);
        }
        
        // Get the requested tutorial or default to charging
        const tutorialType = args?.tutorial || "charging";
        return this.#tutorials[tutorialType] || this.#tutorials.charging;
    }
}