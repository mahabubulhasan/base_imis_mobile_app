import React from 'react';
import {StyleSheet, View} from 'react-native';
import {IconButton} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';

import {COLORS} from '../../core/theme';
import {resetBuildingCoords, toogleMapType} from '../../store/slices/map.slice';

const BuidingsMapRightHeader = () => {
  const dispatch = useDispatch();
  const {buildingCoords} = useSelector(state => state.map);
  const resetEnabled = buildingCoords.length > 0;

  const handleToogleMapType = () => dispatch(toogleMapType());
  const handleResetBuildingCoords = () => dispatch(resetBuildingCoords());

  return (
    <View style={styles.row}>
      <IconButton
        icon={
          resetEnabled ? 'close-box-multiple' : 'close-box-multiple-outline'
        }
        color={resetEnabled ? COLORS.light : COLORS.disabled}
        onPress={() => (resetEnabled ? handleResetBuildingCoords() : null)}
      />
      <IconButton icon="map" color={'#fff'} onPress={handleToogleMapType} />
    </View>
  );
};

export default BuidingsMapRightHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
