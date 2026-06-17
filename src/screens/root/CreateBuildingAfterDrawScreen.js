import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import RNFB from 'react-native-blob-util';
import dayjs from 'dayjs';

import {Header} from '../../components/headers';
import BuildingDraftForm from '../../components/building/BuildingDraftForm';
import {COLORS} from '../../core/theme';
import {buildBuildingKml} from '../../helpers/buildingKml';
import {addBuildingsData, resetBuildingCoords} from '../../store/slices/map.slice';

const CreateBuildingAfterDrawScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {contentsLabel} = useSelector(state => state.auth);
  const {buildingCoords} = useSelector(state => state.map);
  const [saving, setSaving] = useState(false);
  const polygonCoordsRef = useRef(
    Array.isArray(buildingCoords) && buildingCoords.length >= 3
      ? buildingCoords
      : null,
  );

  useEffect(() => {
    if (Array.isArray(buildingCoords) && buildingCoords.length >= 3) {
      polygonCoordsRef.current = buildingCoords;
    }
  }, [buildingCoords]);

  const getLabel = key => contentsLabel?.[key] || key;

  const handleSave = useCallback(
    async ({sanitizedValues, houseImageFile}) => {
      const coords = polygonCoordsRef.current;
      if (!Array.isArray(coords) || coords.length < 3) {
        Alert.alert(
          getLabel('Error'),
          getLabel('Please draw a valid building polygon first.'),
        );
        return;
      }

      try {
        setSaving(true);
        const fileParts = [
          sanitizedValues.temp_building_code,
          sanitizedValues.tax_code,
        ].filter(Boolean);
        const fileBase = `${fileParts.join('_')}_${Date.now()}`;
        const kmlPath = `${RNFB.fs.dirs.DownloadDir}/${fileBase}.kml`;
        const xml = buildBuildingKml(coords, sanitizedValues.temp_building_code);
        await RNFB.fs.writeFile(kmlPath, xml);

        dispatch(
          addBuildingsData({
            ...sanitizedValues,
            coords,
            path: kmlPath,
            kml_file_name: `${fileBase}.kml`,
            house_image: houseImageFile,
            upload_status: 'pending',
            last_error: null,
            updated_at: dayjs().toISOString(),
          }),
        );

        Alert.alert(
          getLabel('Saved'),
          getLabel(
            'Building draft has been saved locally and is ready to upload.',
          ),
          [
            {
              text: getLabel('OK'),
              onPress: () => {
                dispatch(resetBuildingCoords());
                navigation.goBack();
              },
            },
          ],
        );
      } catch (error) {
        Alert.alert(getLabel('Error'), getLabel('Building draft could not be saved.'));
      } finally {
        setSaving(false);
      }
    },
    [dispatch, getLabel, navigation],
  );

  return (
    <View style={styles.container}>
      <Header title={getLabel('Create Building')} />
      <BuildingDraftForm
        onSave={handleSave}
        saveLabel={getLabel('Save Locally')}
        saving={saving}
      />
    </View>
  );
};

export default CreateBuildingAfterDrawScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
});
