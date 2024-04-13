

module.exports = function(RED) {
    "use strict";
    class XDisplay {
        constructor(n) {
            RED.nodes.createNode(this,n);
            var node = this;
            node.config = n;
            node.xDisplayCode = this.formatXDisplayCode(n.xDisplayCode);
            node.mqttQos = 1;
            node.brokerConn = RED.nodes.getNode(n.broker);

            //mqtt
            if (node.brokerConn) {
                node.brokerConn.register(node);
                node.brokerConn.connect(node.onMQTTConnect());
                node.client.on('connect', () => this.isConnected());
                node.client.on('message', (topic, message) => this.onMQTTMessage(topic, message));

                node.client.on('close', () => this.onMQTTClose());
                node.client.on('end', () => this.onMQTTEnd());
                node.client.on('reconnect', () => this.onMQTTReconnect());
                node.client.on('offline', () => this.onMQTTOffline());
                node.client.on('disconnect', (error) => this.onMQTTDisconnect(error));
                node.client.on('error', (error) => this.onMQTTError(error));
            }
        }

        formatXDisplayCode(code){
            if (code.startsWith("0b")){
                code = code.substring(2);
            }
            return code.toUpperCase();
        }

        isConnected(){
            var node = this;
            node.connection = true;
            node.log('MQTT Connected');
        }

        subscribeMQTT() {
            var node = this;
            node.client.subscribe(node.getTopic('/temp'), {'qos':parseInt(node.config.mqttQos||0)}, function(err) {
                if (err) {
                    node.warn('MQTT Error: Subscribe to "' + node.getTopic('/temp'));
                    node.emit('onConnectError', err);
                } else {
                    node.log('MQTT Subscribed to: "' + node.getTopic('/temp'));
                }
            });
        }

        subscribeTopic(suffix){
            var node = this;
            node.client.subscribe(node.getTopic(suffix), {'qos':parseInt(node.config.mqttQos||0)}, function(err) {
                if (err) {
                    node.warn('MQTT Error: Subscribe to "' + node.getTopic(suffix));
                    node.emit('onConnectError', err);
                } else {
                    node.log('MQTT Subscribed to: "' + node.getTopic(suffix));
                }
            });
        }

        unsubscribeMQTT() {
            var node = this;
            node.log('MQTT Unsubscribe from mqtt topic: ' + node.getTopic('/#'));
            node.client.unsubscribe(node.getTopic('/#'), function(err) {});
            node.devices_values = {};
        }

        publish(command, value){
            const topic = this.getTopic(command)
            this.client.publish(topic, value)
        }

        getBaseTopic() {
            return "x-display_" + this.xDisplayCode;
        }

        getTopic(path) {
            if (path.charAt(0) === "/"){
                return this.getBaseTopic() + path;
            } else {
                return this.getBaseTopic() + "/" + path;
            }
        }

        onMQTTConnect() {
            var node = this;
            node.client = node.brokerConn.client;
            node.emit('onMQTTConnect');
            node.subscribeMQTT();
        }

        onMQTTDisconnect(error) {
            var node = this;
            // node.connection = true;
            node.log('MQTT Disconnected');
            console.log(error);
        }

        onMQTTError(error) {
            var node = this;
            // node.connection = true;
            node.log('MQTT Error');
            console.log(error);
        }

        onMQTTOffline() {
            let node = this;
            // node.connection = true;
            node.warn('MQTT Offline');
        }

        onMQTTEnd() {
            var node = this;
            // node.connection = true;
            node.log('MQTT End');
        }

        onMQTTReconnect() {
            var node = this;
            // node.connection = true;
            node.log('MQTT Reconnect');
        }

        onMQTTClose() {
            var node = this;
            // node.connection = true;
            node.log('MQTT Close');
        }

        onMQTTMessage(topic, message) {
            var node = this;
            if (topic.startsWith(node.getBaseTopic())){
                var messageString = message.toString();
                var msg = {topic: topic, payload: messageString}
                // console.log(topic);
                // console.log(messageString);
                try {
                    node.emit('onMQTTMessage', msg);
                } catch (error){
                    node.debug("Error to process message: "+error);
                }
            }
        }

        onClose() {
            var node = this;
            node.unsubscribeMQTT();
            node.client.end();
            node.connection = false;
            node.emit('onClose');
            node.log('MQTT connection closed');
        }

    }
	RED.nodes.registerType("gce-X-Display", XDisplay);
}