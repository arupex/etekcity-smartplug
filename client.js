let FormData = require('form-data');

module.exports = class EtekCityClient {

    constructor() {
        const HyperRequest = require('hyper-request');
        this.client = new HyperRequest({
            baseUrl: 'https://server1.vesync.com:4007',
            disablePipe: true,
            respondWithProperty: false,
            parserFunction: function (data) {
                return JSON.parse(data.replace(/\\/g, '').replace('"[', '[').replace(']"', ']'));
            }
        });
    }

    login(username, password) {
        let formData = new FormData();
        formData.append('Account', username);
        formData.append('Password', password);
        formData.append('AppVersion', '1.70.2');
        formData.append('AppVersionCode', '111');
        formData.append('OS', 'Android');
        formData.append('DevToken', 'AkuEZmg_eu5m14eQRDxqYBsUzR-I7ZjaQtmKvU5Mw5a2');

        return this.client.post('/login', {
            headers: Object.assign({
                password: password,
                account: username,
                'Content-Type': 'application/x-www-form-urlencoded'
            }, formData.getHeaders())
        }).then((response) => {
            this.token = response.tk;
            this.uniqueId = response.id;
        });
    }

    getDevices() {
        return this.client.post('/loadMain', {
            headers: {
                tk: this.token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then((response) => {

            let devices = response.devices.map((device) => {
                return {
                    id: device.id,
                    name: device.deviceName,
                    status: device.relay
                };
            });
            return devices;
        });
    }

    getMeter(deviceId) {
        let formData = new FormData();
        formData.append('cid', deviceId);
        formData.append('uri', '/getRuntime');

        return this.client.post('/devRequest', {
            headers: Object.assign({
                tk: this.token,
                id: this.uniqueId,
                uniqueId: this.uniqueId,
                cid : deviceId,
                'Content-Type': 'application/x-www-form-urlencoded',
            }, formData.getHeaders()),
            body : {
                cid : deviceId,
                uri : '/getRuntime'
            }
        }).then(response => {
            if(response.power !== 'NaN'){
                response.power = this.parseNumeric(response.power).current;
            }
            if(response.voltage !== 'NaN'){
                response.voltage = this.parseNumeric(response.voltage).current;
            }
            if(response.current !== 'NaN'){
                response.current = this.parseNumeric(response.current).current;
            }
            return response;
        });
    }

    _round(value) {
        return Math.round(value / 3600 * 1000) / 1000;
    }

    getStats(deviceId,
             reqDate = new Date().toISOString().slice(0,10).replace(/-/g,''),
             timeZoneOffset = new Date().getTimezoneOffset() / -60,
             round = true) {

        let formData = new FormData();
        formData.append('cid', deviceId);
        formData.append('date', reqDate);
        formData.append('Type', 'extDay');
        formData.append('zoneOffset', timeZoneOffset);

        return this.client.post('/loadStat', {
            headers: Object.assign({
                tk: this.token,
                id: this.uniqueId,
                uniqueId: this.uniqueId,
                cid : deviceId,
                'Content-Type': 'application/x-www-form-urlencoded',
            }, formData.getHeaders()),
            body : {
                cid : deviceId,
                date : reqDate,
                Type: 'extDay',
                zoneOffset: timeZoneOffset
            }
        }).then(response => {
            response.currentDay = round?this._round(response.currentDay) : response.currentDay;
            response.sevenDay   = round?this._round(response.sevenDay)   : response.sevenDay;
            response.thirtyDay  = round?this._round(response.thirtyDay)  : response.thirtyDay;
            return response;
        });
    }

    // This is pulled directly(ported to javascript) from the Mobile apps Java source code
    parseNumeric(input) {
        let split = input.split(':');
        let v_stat = parseInt(split[0], 16);
        let v_imm = parseInt(split[1], 16);

        let current = (v_stat >> 12) + ( (4095 & v_stat) / 1000.0 );
        let instant = (v_imm >> 12) + ( (4095 & v_imm) / 1000.0 );
        return { current, instant };
    }

    turnOn(deviceId) {
        let formData = new FormData();
        formData.append('cid', deviceId);
        formData.append('uri', '/relay');
        formData.append('action', 'open');

        return this.client.post('/devRequest', {
            headers: Object.assign({
                tk: this.token,
                id: this.uniqueId,
                uniqueId: this.uniqueId,
                'Content-Type': 'application/x-www-form-urlencoded'
            }, formData.getHeaders()),
            body : {
                cid : deviceId,
                uri : '/relay',
                action : 'open'
            }
        }).then(response => {
            return response;
        });
    }

    turnOff(deviceId) {
        let formData = new FormData();
        formData.append('cid', deviceId);
        formData.append('uri', '/relay');
        formData.append('action', 'break');

        return this.client.post('/devRequest', {
            headers: Object.assign({
                tk: this.token,
                id: this.uniqueId,
                uniqueId: this.uniqueId,
                'Content-Type': 'application/x-www-form-urlencoded'
            }, formData.getHeaders()),
            body : {
                cid : deviceId,
                uri : '/relay',
                action : 'break'
            }
        }).then(response => {
            return response;
        });
    }

};