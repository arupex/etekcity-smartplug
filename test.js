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
    console.log(`getting kWh data for ${device.id}`);
    return client.getStats(device.id).then( (statData) => {
        console.log(`daily total ${statData.currentDay} kWh and 7 day total ${statData.sevenDay}`
            + ` kWh and 30 day total ${statData.thirtyDay} kWh`);
        return client.getStats(device.id, '20171119', -5, false, Client.HISTORIC_STAT_TYPES.DAY).then( (dailyStats) => {
            console.log(`Daily Data ${JSON.stringify(dailyStats)}`);
            return device;
        });
    });
}).then( (device) => {
    if(device.status === 'open') {
        console.log(`turning device ${device.name} off`);
        // return client.turnOff(device.id);
    }
    else {
        console.log(`turning device ${device.name} on`);
        // return client.turnOn(device.id);
    }
});