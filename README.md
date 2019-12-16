# etekcity-smartplug
    
## Device
    This is a software interface for the Vesync API (ripped from Android Packet Capture and Decompile of Android App)
    for the Vesync Etekcity smart plugs 
    https://www.amazon.com/dp/B01M3MYIFS/ 
    
## Sample Use (Async)
    
    let Client = require('./client');
    
    let config = require('./config.json');
    let client = new Client();
    
    await client.login(config.username, config.password);
    
    let devices = await  client.getDevices();
  
    console.table(devices);
    
    let specificDevice = devices.find( (device) => { return device.name.includes(config.deviceName); });
    
    console.log(`getting data for ${specificDevice.id}`);
    
    let meterData = await client.getMeter(device.id);
    console.log(`device is currently using ${meterData.power} W  and ${meterData.voltage} V`);
        
    console.log(`getting kWh data for ${device.id}`);
    let statData = await client.getStats(device.id);
    
    console.log(`daily total ${statData.currentDay} kWh and 7 day total ${statData.sevenDay} kWh and 30 day total ${statData.thirtyDay} kWh`);
    let dailyStats = await client.getStats(device.id, '20171119', -5, false, Client.HISTORIC_STAT_TYPES.DAY);
    console.log(`Daily Data ${JSON.stringify(dailyStats)}`);

    if(device.status === 'open') {
        console.log(`turning device ${device.name} off`);
        // return client.turnOff(device.id);
    }
    else {
        console.log(`turning device ${device.name} on`);
        // return client.turnOn(device.id);
    }
