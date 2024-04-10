module.exports = function(RED) {
    class xDisplayMqttIn {
        constructor(config) {
            RED.nodes.createNode(this, config);

            let node = this;
            node.config = config;
            node.firstMsg = true;
            node.cleanTimer = null;
            node.broker = RED.nodes.getNode(node.config.broker);
            node.last_value = null;
            node.last_successful_status = {};
            node.status({});

            if (node.broker) {
                // node.listener_onMQTTAvailability = function(data) { node.onMQTTAvailability(data); }
                // node.broker.on('onMQTTAvailability', node.listener_onMQTTAvailability);

                node.listener_onConnectError = function(data) { node.onConnectError(); }
                node.broker.on('onConnectError', node.listener_onConnectError);

                node.listener_onMQTTMessage = function(data) { node.onMQTTMessage(data); }
                node.broker.on('onMQTTMessage', node.listener_onMQTTMessage);

                node.listener_onMQTTBridgeState = function(data) { node.onMQTTBridgeState(data); }
                node.broker.on('onMQTTBridgeState', node.listener_onMQTTBridgeState);

                node.on('close', () => node.onClose());

                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "connected"
                });

            } else {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "no server"
                });
            }
        }

        parseBtnValue(v){
            if (v == "1"){
                return "on"
            } else {
                return "off"
            }
        }

        onMQTTMessage(data) {
            let node = this;
            const topic = data.topic;
            const payload = data.payload;
            const splitedTopic = topic.split("/")
            if (!isNaN(splitedTopic[1])){
                const screenNumber = splitedTopic[1]
                const screenAction = splitedTopic[2]
                // console.log("Received value for screen "+screenNumber+" action: "+screenAction+" with value: "+payload)
                data.screenNumber = screenNumber
                data.action = screenAction
                if (screenAction == "ThState" || screenAction == "ThMeasureState" || screenAction == "temp"){
                    data.payload = Number(data.payload)
                    data.unit = "°C"
                } else if (screenAction == "hum"  || screenAction == "SliderValueState"){
                    data.payload = Number(data.payload)
                    data.unit = "%"
                } else if (screenAction == "lum" ){
                    data.payload = Number(data.payload)
                    data.unit = "lux"
                } else if (screenAction == "IoState" || screenAction == "SliderBtnState"
                            || screenAction == "IoBtn1State" || screenAction == "IoBtn2State"
                            || screenAction == "IoBtn3State" || screenAction == "IoBtn4State"){
                    data.payload = node.parseBtnValue(data.payload)
                } else {
                    data.payload = Number(data.payload)
                }
            } else if (topic == node.broker.getBaseTopic()+"/temp"){
                // console.log("Received temperature value: "+payload)
                data.payload = Number(data.payload)
                data.unit = "°C"
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: payload+"°C"
                });
            }
            node.send(data);
        }

        onMQTTBridgeState(data) {
            let node = this;
            if (data.payload) {
                node.status(node.last_successful_status);
            } else {
                node.onConnectError();
            }
        }

        onConnectError() {
            this.status({
                fill: "red",
                shape: "dot",
                text: "node-red-contrib-xdisplay-mqtt/in:status.no_connection"
            });
        }


        onClose() {
            let node = this;

            // if (node.listener_onMQTTAvailability) {
            //     node.broker.removeListener("onMQTTAvailability", node.listener_onMQTTAvailability);
            // }
            if (node.listener_onConnectError) {
                node.broker.removeListener("onConnectError", node.listener_onConnectError);
            }
            if (node.listener_onMQTTMessage) {
                node.broker.removeListener("onMQTTMessage", node.listener_onMQTTMessage);
            }
            if (node.listener_onMQTTBridgeState) {
                node.broker.removeListener("onMQTTBridgeState", node.listener_onMQTTBridgeState);
            }

            node.onConnectError();
        }

        setSuccessfulStatus(obj) {
            this.status(obj);
            this.last_successful_status = obj;
        }

    }
    RED.nodes.registerType('xdisplay-mqtt-in', xDisplayMqttIn);
};


