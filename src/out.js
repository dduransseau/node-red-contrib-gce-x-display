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
            // console.log("Send action "+node.config.action+" to display")
            node.broker.publish(node.config.action, msg.payload)
            // msg.payload = result;
			// send(msg);
			// done();
        });
    }
	RED.nodes.registerType('xdisplay-mqtt-out', xDisplayMqttOut);
};
