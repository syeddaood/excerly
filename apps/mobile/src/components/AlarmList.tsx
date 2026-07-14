import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';

const AlarmList = () => {
  const alarms = [];

  return (
    <View>
      <Text>Alarm List</Text>
      <FlatList
        data={alarms}
        renderItem={({ item }) => (
          <View>
            <Text>{item.label}</Text>
            <Button title="Edit" onPress={() => {}} />
            <Button title="Delete" onPress={() => {}} />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default AlarmList;
