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

    static get HISTORIC_STAT_TYPES() {
        return {
            DAY: 'day',
            MONTH: 'month',
            YEAR: 'year',
            EXT_DAY: 'extDay'
        }
    };

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
             round = true,
             type = EtekCityClient.HISTORIC_STAT_TYPES.EXT_DAY) {

        let formData = new FormData();
        formData.append('cid', deviceId);
        formData.append('date', reqDate);
        formData.append('Type', type);
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
                Type: type,
                zoneOffset: timeZoneOffset
            }
        }).then(response => {
            if(type === EtekCityClient.HISTORIC_STAT_TYPES.EXT_DAY) {
                return {
                    //API has it spelt cuurentDay...dont ask
                    currentDay: round ? this._round(response.cuurentDay) : response.cuurentDay,
                    sevenDay: round ? this._round(response.sevenDay) : response.sevenDay,
                    thirtyDay: round ? this._round(response.thirtyDay) : response.thirtyDay
                };
            }
            else if(Array.isArray(response)){
                return response.map(e => { return { value : e }; });//future put timestamp in
            }
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