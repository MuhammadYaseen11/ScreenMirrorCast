import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { NetworkInfo } from 'react-native-network-info'; // Correct import for getting the device IP
import socketIOClient from 'socket.io-client'; // For communication with the TV
import Zeroconf from 'react-native-zeroconf'; // For discovering devices via mDNS

const App = () => {
  const [ip, setIp] = useState('');
  const [devices, setDevices] = useState<string[]>([]); // Explicitly typing the state
  const [isConnected, setIsConnected] = useState(false);
  const [zeroconf, setZeroconf] = useState<any>(null); // Set Zeroconf instance

  useEffect(() => {
    // Ensure Zeroconf is initialized when the component mounts
    const zconf = new Zeroconf();
    setZeroconf(zconf);
    return () => {
      // Clean up when the component is unmounted
      zconf.stop();
    };
  }, []);

  // Get the device's local IP address
  const getIpAddress = async () => {
    try {
      const localIp = await NetworkInfo.getIPAddress();
      if (localIp) {
        setIp(localIp);
      } else {
        console.log('IP address is null');
      }
    } catch (error) {
      console.log('Error getting IP address:', error);
    }
  };

  // Connect to the TV
  const connectToTV = (tvIp: string) => {
    const socket = socketIOClient(`http://${tvIp}:3000`); // Assuming port 3000 for communication

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to TV');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from TV');
    });

    socket.on('connect_error', (err) => {
      console.log(`Connection failed: ${err.message}`);
    });
  };

  // Send media to the TV (for example, a video file)
  const sendMediaToTV = (mediaUrl: string) => {
    if (isConnected) {
      const socket = socketIOClient(ip);
      socket.emit('media', mediaUrl);
      console.log(`Sending media: ${mediaUrl}`);
    } else {
      console.log('No connection to TV');
    }
  };

  // Example: Button to send a video media file
  const handleSendVideo = () => {
    sendMediaToTV('http://path/to/video/file.mp4');
  };

  // Search for TV devices on the local network using Zeroconf (mDNS)
  const searchForDevices = () => {
    if (zeroconf) {
      zeroconf.scan('_http._tcp.local.'); // Start discovering devices with the service type '_http._tcp.local.'
      
      zeroconf.on('found', (service: any) => {
        console.log('Found service:', service);
        const tvDeviceList = service.addresses.map((address: string) => address);
        setDevices(tvDeviceList);
      });

      zeroconf.on('error', (error: Error) => {
        console.log('Error discovering devices:', error);
      });
    } else {
      console.log('Zeroconf is not initialized.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Screen Mirror Cast</Text>
      <Text>Device IP: {ip}</Text>
      <Button title="Get Device IP" onPress={getIpAddress} />
      <Button title="Search for TVs" onPress={searchForDevices} />
      <FlatList
        data={devices}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => connectToTV(item)}>
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="Send Video to TV" onPress={handleSendVideo} />
    </View>
  );
};

export default App;
