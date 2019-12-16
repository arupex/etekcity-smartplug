(async () => {
    let Client = require('./client');

    let config = require('./config.json');
    let client = new Client();

    await client.login(config.username, config.password);

    let devices = await client.getDevices();

    console.table(devices);

    let theaterLight = devices.find((device) => {
        return device.name.includes('theater');
    });

    console.log(`getting data for ${theaterLight.id}`);

    let meterData = await client.getMeter(theaterLight.id);
    console.log(`device is currently using ${meterData.power} W  and ${meterData.voltage} V`);

    console.log(`getting kWh data for ${theaterLight.id}`);
    let statData = await client.getStats(theaterLight.id);

    console.log(`daily total ${statData.currentDay} kWh and 7 day total ${statData.sevenDay} kWh and 30 day total ${statData.thirtyDay} kWh`);
    let dailyStats = await client.getStats(theaterLight.id, '20171119', -5, false, Client.HISTORIC_STAT_TYPES.DAY);
    console.log(`Daily Data ${JSON.stringify(dailyStats)}`);

    if (theaterLight.status === 'open') {
        console.log(`turning device ${theaterLight.name} off`);
        // return client.turnOff(device.id);
    } else {
        console.log(`turning device ${theaterLight.name} on`);
        // return client.turnOn(device.id);
    }
})();