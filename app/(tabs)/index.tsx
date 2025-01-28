import React, { useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { NetworkInfo } from 'react-native-network-info'; // Correct import
import socketIOClient from 'socket.io-client'; // For communication between the phone and TV

const App = () => {
  const [ip, setIp] = useState('');
  const [devices, setDevices] = useState<string[]>([]); // Explicitly typing the state
  const [isConnected, setIsConnected] = useState(false);

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

  const connectToTV = (tvIp: string) => {
    const socket = socketIOClient(`http://${tvIp}:3000`); // Assuming port 3000, update if necessary
  
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
  

  // Send a media file to the TV (for example, a video file)
  const sendMediaToTV = (mediaUrl: string) => {
    if (isConnected) {
      const socket = socketIOClient(ip);
      socket.emit('media', mediaUrl);
      console.log(`Sending media: ${mediaUrl}`);
    } else {
      console.log('No connection to TV');
    }
  };

  // Example: Button to send video media
  const handleSendVideo = () => {
    sendMediaToTV('http://path/to/video/file.mp4');
  };

  // Use the IP matching method here if the TV app is running and listens for the specific IP
  const searchForDevices = async () => {
    // Implement search logic based on TV app's IP matching functionality.
    const tvDeviceList = ['192.168.1.2', '192.168.1.3']; // Example IPs
    setDevices(tvDeviceList);
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
