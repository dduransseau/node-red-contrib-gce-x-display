

module.exports = function(RED) {
    "use strict";
    var mqtt = require("mqtt");
    class Gateway {
        constructor(n) {
            RED.nodes.createNode(this,n);
            var node = this;
            node.config = n;
            node.host = n.host;
            node.port = n.port;
            node.xDisplayCode = n.xDisplayCode;
            node.mqttQos = 1;

            // node.log("Definition: "+JSON.stringify(eepDefinition))

            //mqtt
            node.mqtt = node.connectMQTT();
            node.mqtt.on('connect', () => this.onMQTTConnect());
            node.mqtt.on('message', (topic, message) => this.onMQTTMessage(topic, message));

            node.mqtt.on('close', () => this.onMQTTClose());
            node.mqtt.on('end', () => this.onMQTTEnd());
            node.mqtt.on('reconnect', () => this.onMQTTReconnect());
            node.mqtt.on('offline', () => this.onMQTTOffline());
            node.mqtt.on('disconnect', (error) => this.onMQTTDisconnect(error));
            node.mqtt.on('error', (error) => this.onMQTTError(error));
        }


        connectMQTT(clientId = null) {
            var node = this;
            var options = {
                port: node.config.port || 1883,
                clientId: 'NodeRed-' + node.id + '-' + (clientId ? clientId : (Math.random() + 1).toString(36).substring(7)),
            };

            let baseUrl = 'mqtt://';

            return mqtt.connect(baseUrl + node.config.host, options);
        }

        subscribeMQTT() {
            var node = this;
            node.mqtt.subscribe(node.getTopic('/#'), {'qos':parseInt(node.config.mqttQos||0)}, function(err) {
                if (err) {
                    node.warn('MQTT Error: Subscribe to "' + node.getTopic('/#'));
                    node.emit('onConnectError', err);
                } else {
                    node.log('MQTT Subscribed to: "' + node.getTopic('/#'));
                }
            });
        }

        unsubscribeMQTT() {
            var node = this;
            node.log('MQTT Unsubscribe from mqtt topic: ' + node.getTopic('/#'));
            node.mqtt.unsubscribe(node.getTopic('/#'), function(err) {});
            node.devices_values = {};
        }

        publish(command, value){
            const topic = this.getTopic(command)
            this.mqtt.publish(topic, value)
        }

        getBaseTopic() {
            return "x-display_" + this.config.xDisplayCode;
        }

        getTopic(path) {
            if (path.charAt(0) === "/"){
                return this.getBaseTopic() + path;
            } else {
                return this.getBaseTopic() + "/" + path;
            }
        }

        // nodeSend(node, opts) {
        //     this.nodeSendSingle(node, opts)
        // }

        onMQTTConnect() {
            var node = this;
            node.connection = true;
            node.log('MQTT Connected');
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
            console.log(error);j
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
            // console.log();

        }

        onMQTTReconnect() {
            var node = this;
            // node.connection = true;
            node.log('MQTT Reconnect');
            // console.log();

        }

        onMQTTClose() {
            var node = this;
            // node.connection = true;
            node.log('MQTT Close');
            // console.log(node.connection);

        }

        onMQTTMessage(topic, message) {
            var node = this;
            var messageString = message.toString();
            var msg = {topic: topic, payload: messageString}
            // console.log(topic);
            // console.log(messageString);


            try {
                node.emit('onMQTTMessage', msg);
            } catch (error){
                if (error.name === "TypeError") {
                    node.debug("Error to parse json message: "+error);
                } else {
                    node.debug("Error to process message: "+error);
                }
            }
        }

        onClose() {
            var node = this;
            node.unsubscribeMQTT();
            node.mqtt.end();
            node.connection = false;
            node.emit('onClose');
            node.log('MQTT connection closed');
        }

    }
	RED.nodes.registerType("gateway", Gateway);
}