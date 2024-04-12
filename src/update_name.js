module.exports = function(RED) {

    function xDisplayMqttOut(config) {
        // console.log("Create output x-display node: "+JSON.stringify(config))
        RED.nodes.createNode(this, config);
        // Store the node instance for later use
        const node = this;
        node.config = config;
		node.broker = RED.nodes.getNode(node.config.broker);

        // Handle incoming messages
        node.on('input', async function(msg, send, done) {
            let screen = undefined;
            if (msg.screen){
                screen = msg.screen
            } else if (node.config.screen){
                screen = node.config.screen
            } else {
                console.log("No screen defined for type update, abort")
                return
            }
            node.broker.publish(screen+"/updateName", msg.payload)
        });
    }
	RED.nodes.registerType('xdisplay-mqtt-update-name', xDisplayMqttOut);
};
