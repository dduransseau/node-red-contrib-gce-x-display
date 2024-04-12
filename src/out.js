module.exports = function(RED) {

    function xDisplayScreenCommand(config) {
        // console.log("Create output x-display node: "+JSON.stringify(config))
        RED.nodes.createNode(this, config);
        // Store the node instance for later use
        const node = this;
        node.config = config;
		node.broker = RED.nodes.getNode(node.config.broker);

        // Handle incoming messages
        node.on('input', async function(msg, send, done) {
            let screen = undefined;
            let action = undefined;
            let value = msg.payload;

            if (msg.screen){
                screen = msg.screen
            } else if (node.config.screen){
                screen = node.config.screen
            } else {
                console.log("No screen defined for type update, abort")
                return
            }
            if (msg.action){
                action = msg.action
            } else if (node.config.action){
                action = node.config.action
            } else {
                console.log("No action defined for type update, abort")
                return
            }

            if (action && (action.startsWith("Io") || action.startsWith("SliderBtn"))){
                if (value == true){
                    value = "1"
                } else if (value == false){
                    value = "0"
                } else if (value.toLowerCase() === "on"){
                    value = "1"
                } else {
                    value = "0"
                }
            }

            // console.log("Send action "+node.config.action+" to display")
            node.broker.publish(screen+"/"+action, value)
            // msg.payload = result;
			// send(msg);
			// done();
        });
    }
	RED.nodes.registerType('xdisplay-mqtt-out', xDisplayScreenCommand);
};
