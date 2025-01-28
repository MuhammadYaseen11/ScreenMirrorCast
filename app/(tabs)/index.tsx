import React, { useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { NetworkInfo } from 'react-native-network-info'; // Correct import
import socketIOClient from 'socket.io-client'; // Import socket.io-client
import dgram from 'react-native-udp'; // UDP library

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

  // Set up a UDP client to send a discovery message
  const searchForDevices = async () => {
    const client = dgram.createSocket({ type: 'udp4' }); // Create a UDP client
    const message = Buffer.from('DISCOVER'); // Message to send for device discovery

    // Broadcast to the local network
    const broadcastAddress = '255.255.255.255'; // Broadcast address
    const port = 12345; // Port to send the message to
    client.send(message, 0, message.length, port, broadcastAddress, (err) => {
      if (err) {
        console.error('Error sending broadcast:', err);
      } else {
        console.log('Discovery message sent');
      }
    });

    // Listen for incoming responses on the broadcast port
    client.on('message', (msg, rinfo) => {
      console.log(`Received message: ${msg} from ${rinfo.address}:${rinfo.port}`);
      if (msg.toString() === 'TV_RESPONSE') {
        // Assuming TV responds with 'TV_RESPONSE'
        setDevices((prevDevices) => [...prevDevices, rinfo.address]); // Add found IPs to the list
      }
    });

    client.bind(12345, () => {
      client.setBroadcast(true); // Enable broadcasting
    });
  };

  const connectToTV = (tvIp: string) => {
    // Implement socket connection to the TV, assuming it's on port 3000
    const socket = socketIOClient(`http://${tvIp}:3000`);

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

  const sendMediaToTV = (mediaUrl: string) => {
    if (isConnected) {
      const socket = socketIOClient(ip);
      socket.emit('media', mediaUrl);
      console.log(`Sending media: ${mediaUrl}`);
    } else {
      console.log('No connection to TV');
    }
  };

  const handleSendVideo = () => {
    sendMediaToTV('http://path/to/video/file.mp4');
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
