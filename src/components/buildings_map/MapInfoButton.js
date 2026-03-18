import React from 'react';
import {StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {FAB, Portal} from 'react-native-paper';

import {COLORS, SPACINGS} from '../../core/theme';

import Icon from 'react-native-vector-icons/Ionicons';

const MapInfoButton = ({onPress, buildingCoords}) => {
  // const {buildingCoords} = useSelector(state => state.map);

  // check if building coords has elements
  const enabled = buildingCoords.length >= 4;
  console.log('MapInforButton', enabled, buildingCoords.length);

  const handleInfoPress = () => {
    onPress(true);
  };

  return (
    <Portal>
      <FAB
        style={[
          styles.fab,
          {backgroundColor: enabled ? COLORS.primary : COLORS.disabled},
        ]}
        disabled={!enabled}
        color={COLORS.light}
        animated={false}
        onPress={handleInfoPress}
        icon={() => <Icon name="save" size={25} color="white" />}
        theme={{
          colors: {
            primary: enabled ? COLORS.accent : COLORS.lightGrey,
          },
        }}
      />
    </Portal>
  );
};

export default React.memo(MapInfoButton);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 15,
    bottom: 30,
  },
});
