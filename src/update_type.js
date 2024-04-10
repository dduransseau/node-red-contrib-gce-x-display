module.exports = function(RED) {

    function xDisplayUpdateType(config) {
        // console.log("Create output x-display node: "+JSON.stringify(config))
        RED.nodes.createNode(this, config);
        // Store the node instance for later use
        const node = this;
        node.config = config;
		node.broker = RED.nodes.getNode(node.config.broker);

        // Handle incoming messages
        node.on('input', async function(msg, send, done) {
            // console.log("Send action "+node.config.action+" to display")
            let screen = undefined;
            let screenType = undefined;
            if (msg.screen){
                screen = msg.screen
            } else if (node.config.screen){
                screen = node.config.screen
            } else {
                console.log("No screen defined for type update, abort")
                return
            }
            if (msg.type){
                screenType = msg.type
            } else if (node.config.screenType){
                screenType = node.config.screenType
            } else {
                console.log("No type defined for type update, abort")
                return
            }
            // console.log("Set type "+screenType+" to screen "+screen)
            node.broker.publish(screen+"/update", screenType)
        });
    }
	RED.nodes.registerType('xdisplay-mqtt-update-type', xDisplayUpdateType);
};
