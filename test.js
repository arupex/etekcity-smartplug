let Client = require('./client');

let config = require('./config.json');
let client = new Client();

client.login(config.username, config.password).then( () => {
    return client.getDevices();
}).then( devices => {
    return devices.find( (device) => { return device.name.includes(config.deviceName); });
}).then( device => {
    console.log(`getting data for ${device.id}`);
    return client.getMeter(device.id).then( (meterData) => {
        console.log(`device is currently using ${meterData.power} W  and ${meterData.voltage} V`);
        return device;
    });
}).then( (device) => {
    if(device.status === 'open') {
        console.log(`turning device ${device.name} off`);
        return client.turnOff(device.id);
    }
    else {
        console.log(`turning device ${device.name} on`);
        return client.turnOn(device.id);
    }
});