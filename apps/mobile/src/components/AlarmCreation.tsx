import React from 'react';
import { View, Text, Button, TextInput } from 'react-native';

const AlarmCreation = () => {
  return (
    <View>
      <Text>Create Alarm</Text>
      {/* Add inputs for time, repeat days, label, sound, mission type */}
      <TextInput placeholder="Time" />
      <TextInput placeholder="Repeat Days" />
      <TextInput placeholder="Label" />
      <TextInput placeholder="Sound" />
      <TextInput placeholder="Mission Type" />
      <Button title="Create Alarm" onPress={() => {}} />
    </View>
  );
};

export default AlarmCreation;
