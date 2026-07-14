import React from 'react';
import { View, Text, Button, TextInput } from 'react-native';

const AlarmEdit = () => {
  return (
    <View>
      <Text>Edit Alarm</Text>
      {/* Add inputs for time, repeat days, label, sound, mission type */}
      <TextInput placeholder="Time" />
      <TextInput placeholder="Repeat Days" />
      <TextInput placeholder="Label" />
      <TextInput placeholder="Sound" />
      <TextInput placeholder="Mission Type" />
      <Button title="Save Changes" onPress={() => {}} />
    </View>
  );
};

export default AlarmEdit;
