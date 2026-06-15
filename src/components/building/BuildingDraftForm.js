import React, {useEffect, useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {
  ActivityIndicator,
  Button,
  HelperText,
  Text,
  TextInput,
} from 'react-native-paper';
import {useSelector} from 'react-redux';
import DocumentPicker from 'react-native-document-picker';
import DatePicker from 'react-native-date-picker';
import dayjs from 'dayjs';

import SelectionInput from '../inputs/SelectionInput';
import {COLORS, SPACINGS} from '../../core/theme';
import {
  BUILDING_FORM_INITIAL_VALUES,
  getVisibleConditionalFields,
  sanitizeBuildingDraftByVisibility,
  validateBuildingDraft,
} from '../../helpers/buildingDraft';
import {getOptionLabel, getYesNoOptions} from '../../helpers/buildingFormOptions';
import {openSelectionSheet} from '../../helpers/openSelectionSheet';
import useBuildingFormMetadata from '../../hooks/useBuildingFormMetadata';

const formatTaxCode = value => {
  const cleaned = String(value ?? '')
    .replace(/[^0-9]/g, '')
    .slice(0, 11);

  const parts = [
    cleaned.slice(0, 2),
    cleaned.slice(2, 5),
    cleaned.slice(5, 9),
    cleaned.slice(9, 11),
  ].filter(Boolean);

  return parts.join('-');
};

const numericOnly = value => String(value ?? '').replace(/[^0-9]/g, '');

const BuildingDraftForm = ({
  initialValues = BUILDING_FORM_INITIAL_VALUES,
  initialHouseImage = null,
  onSave,
  saveLabel = 'Save Locally',
  saving = false,
}) => {
  const {contentsLabel} = useSelector(state => state.auth);
  const {
    isReady,
    isInitialLoading,
    status: metadataStatus,
    error: metadataError,
    retry,
    getDropdowns,
  } = useBuildingFormMetadata();

  const getLabel = key => contentsLabel?.[key] || key;
  const reqLabel = key => `${getLabel(key)} *`;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [houseImageFile, setHouseImageFile] = useState(initialHouseImage);
  const [activeDateField, setActiveDateField] = useState(null);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    setHouseImageFile(initialHouseImage);
  }, [initialHouseImage]);

  const dropdowns = useMemo(
    () => getDropdowns(values.functional_use_id),
    [getDropdowns, values.functional_use_id],
  );

  const yesNoOptions = useMemo(() => getYesNoOptions(getLabel), [contentsLabel]);

  const visible = useMemo(
    () => getVisibleConditionalFields(values),
    [values],
  );

  const openSelect = async (
    title,
    options,
    currentValue,
    onSelected,
    searchable = true,
  ) => {
    const selected = await openSelectionSheet({
      title,
      options,
      selectedValue: currentValue,
      searchable,
    });
    if (selected !== undefined) {
      onSelected(selected);
    }
  };

  const setFieldValue = (key, value) => {
    setValues(prev => {
      const next = {...prev, [key]: value};

      if (key === 'functional_use_id') {
        next.use_category_id = '';
      }

      if (key === 'main_building' && String(value) !== '0') {
        next.building_associated_to = '';
      }

      if (key === 'water_source_id' && String(value) !== '5') {
        next.watersupply_pipe_code = '';
      }

      if (key === 'toilet_status' && String(value) === '1') {
        next.defecation_place = '';
        next.ctpt_name = '';
      }

      if (key === 'toilet_status' && String(value) === '0') {
        next.sanitation_system_id = '';
        next.build_contain = '';
        next.sewer_code = '';
        next.drain_code = '';
        next.household_with_private_toilet = '';
        next.population_with_private_toilet = '';
      }

      if (key === 'defecation_place' && String(value) !== '9') {
        next.ctpt_name = '';
      }

      if (key === 'sanitation_system_id') {
        if (String(value) !== '11') next.build_contain = '';
        if (String(value) !== '1') next.sewer_code = '';
        if (String(value) !== '2') next.drain_code = '';
      }

      return next;
    });

    setErrors(prev => ({...prev, [key]: undefined}));
  };

  const pickHouseImage = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
      });
      if (picked?.size && picked.size > 5 * 1024 * 1024) {
        Alert.alert(getLabel('Error'), getLabel('Image size can not exceed 5 MB.'));
        return;
      }
      setHouseImageFile({
        uri: picked.uri,
        type: picked.type || 'image/jpeg',
        name: picked.name || 'house.jpg',
      });
    } catch (error) {
      // picker cancelled
    }
  };

  const handleSave = async () => {
    const sanitizedValues = sanitizeBuildingDraftByVisibility(values);
    const validationErrors = validateBuildingDraft(sanitizedValues);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      Alert.alert(
        getLabel('Validation'),
        getLabel('Please fix form errors before saving.'),
      );
      return;
    }

    await onSave?.({ sanitizedValues, houseImageFile });
  };

  const renderInput = (key, label, props = {}) => (
    <View style={styles.inputWrap}>
      <TextInput
        mode="outlined"
        label={label}
        value={String(values[key] ?? '')}
        onChangeText={text => setFieldValue(key, text)}
        error={!!errors[key]}
        {...props}
      />
      {!!errors[key] && <HelperText type="error">{errors[key]}</HelperText>}
    </View>
  );

  const renderSelection = (
    key,
    label,
    options,
    title = label,
    searchable = true,
  ) => (
    <View style={styles.inputWrap}>
      <SelectionInput
        label={label}
        value={getOptionLabel(options, values[key])}
        error={!!errors[key]}
        onPress={() =>
          openSelect(title, options, values[key], val => setFieldValue(key, val), searchable)
        }
      />
      {!!errors[key] && <HelperText type="error">{errors[key]}</HelperText>}
    </View>
  );

  const getDateValue = key => {
    const parsed = dayjs(values[key]);
    return parsed.isValid() ? parsed.toDate() : new Date();
  };

  const renderDateInput = (key, label, {required = false, maximumDate} = {}) => (
    <View style={styles.inputWrap}>
      <TextInput
        mode="outlined"
        label={required ? reqLabel(label) : getLabel(label)}
        value={String(values[key] ?? '')}
        editable={false}
        showSoftInputOnFocus={false}
        error={!!errors[key]}
        right={
          <TextInput.Icon icon="calendar" onPress={() => setActiveDateField(key)} />
        }
        onPressIn={() => setActiveDateField(key)}
      />
      {!!errors[key] && <HelperText type="error">{errors[key]}</HelperText>}
      <DatePicker
        modal
        mode="date"
        open={activeDateField === key}
        date={getDateValue(key)}
        maximumDate={maximumDate}
        onConfirm={date => {
          setFieldValue(key, dayjs(date).format('YYYY-MM-DD'));
          setActiveDateField(null);
        }}
        onCancel={() => setActiveDateField(null)}
      />
    </View>
  );

  const showMetadataOverlay =
    isInitialLoading || (!isReady && metadataStatus === 'failed');

  return (
    <View style={styles.formRoot}>
      <ScrollView contentContainerStyle={styles.content}>
        {isReady && (
          <>
            <Text variant="titleMedium">{getLabel('Required Fields')}</Text>
            {renderInput('temp_building_code', reqLabel('Temp Building Code'))}
            {renderInput('tax_code', reqLabel('Tax Code'), {
              placeholder: 'ww-rrr-hhhh-xx',
              keyboardType: 'numeric',
              onChangeText: text => setFieldValue('tax_code', formatTaxCode(text)),
            })}
            {renderDateInput('collected_date', 'Collected Date (YYYY-MM-DD)', {
              required: true,
              maximumDate: new Date(),
            })}
            {renderSelection('ward', reqLabel('Ward'), dropdowns.ward, getLabel('Ward'))}
            {renderSelection(
              'road_code',
              reqLabel('Road Code'),
              dropdowns.roadCode,
              getLabel('Road Code'),
            )}
            {renderInput('house_number', getLabel('House Number'))}
            {renderSelection(
              'structure_type_id',
              reqLabel('Structure Type'),
              dropdowns.structureType,
              getLabel('Structure Type'),
            )}
            {renderDateInput('construction_year', 'Construction Year (YYYY-MM-DD)', {
              required: true,
              maximumDate: new Date(),
            })}
            {renderInput('floor_count', reqLabel('Floor Count'), {
              keyboardType: 'decimal-pad',
            })}
            {renderInput('population_served', reqLabel('Population Served'), {
              keyboardType: 'numeric',
              onChangeText: text =>
                setFieldValue('population_served', numericOnly(text)),
            })}
            {renderSelection(
              'functional_use_id',
              reqLabel('Functional Use'),
              dropdowns.functionalUse,
              getLabel('Functional Use'),
            )}
            {visible.use_category_id &&
              renderSelection(
                'use_category_id',
                getLabel('Use Category'),
                dropdowns.useCategory,
                getLabel('Use Category'),
              )}
            {renderSelection(
              'water_source_id',
              reqLabel('Water Source'),
              dropdowns.waterSource,
              getLabel('Water Source'),
            )}
            {renderSelection(
              'main_building',
              reqLabel('Main Building'),
              yesNoOptions,
              getLabel('Main Building'),
              false,
            )}
            {visible.building_associated_to &&
              renderSelection(
                'building_associated_to',
                reqLabel('Building Associated To'),
                dropdowns.buildingBin,
                getLabel('Building Bin'),
              )}
            {renderSelection(
              'lic_status',
              getLabel('LIC Status'),
              yesNoOptions,
              getLabel('LIC Status'),
              false,
            )}
            {visible.lic_id &&
              renderSelection(
                'lic_id',
                reqLabel('LIC Name'),
                dropdowns.licNames,
                getLabel('LIC Name'),
              )}
            {renderSelection(
              'toilet_status',
              reqLabel('Toilet Status'),
              yesNoOptions,
              getLabel('Toilet Status'),
              false,
            )}
            {!!errors.toilet_status && (
              <HelperText type="error">{errors.toilet_status}</HelperText>
            )}
            {visible.toilet_count &&
              renderInput('toilet_count', reqLabel('Toilet Count'), {
                keyboardType: 'numeric',
              })}
            {visible.household_with_private_toilet &&
              renderInput(
                'household_with_private_toilet',
                getLabel('Households with Private Toilet'),
                {
                  keyboardType: 'numeric',
                  onChangeText: text =>
                    setFieldValue('household_with_private_toilet', numericOnly(text)),
                },
              )}
            {visible.population_with_private_toilet &&
              renderInput(
                'population_with_private_toilet',
                getLabel('Population with Private Toilet'),
                {
                  keyboardType: 'numeric',
                  onChangeText: text =>
                    setFieldValue('population_with_private_toilet', numericOnly(text)),
                },
              )}
            {visible.sanitation_system_id &&
              renderSelection(
                'sanitation_system_id',
                reqLabel('Sanitation System'),
                dropdowns.toiletConnection,
                getLabel('Toilet Connection'),
              )}
            {visible.defecation_place &&
              renderSelection(
                'defecation_place',
                reqLabel('Defecation Place'),
                dropdowns.defecationPlace,
                getLabel('Defecation Place'),
              )}
            {visible.ctpt_name &&
              renderSelection(
                'ctpt_name',
                reqLabel('CTPT Name'),
                dropdowns.ctpt,
                getLabel('CTPT Name'),
              )}
            {visible.build_contain &&
              renderSelection(
                'build_contain',
                reqLabel('Build Contain'),
                dropdowns.preconnectedBin,
                getLabel('Preconnected BIN'),
              )}
            {visible.sewer_code &&
              renderSelection(
                'sewer_code',
                reqLabel('Sewer Code'),
                dropdowns.sewerCode,
                getLabel('Sewer Code'),
              )}
            {visible.drain_code &&
              renderSelection(
                'drain_code',
                reqLabel('Drain Code'),
                dropdowns.drainCode,
                getLabel('Drain Code'),
              )}
            {visible.watersupply_pipe_code &&
              renderSelection(
                'watersupply_pipe_code',
                getLabel('Water Supply Pipe Code'),
                dropdowns.waterSupply,
                getLabel('Water Supply'),
              )}
            {renderInput('household_served', reqLabel('Household Served'), {
              keyboardType: 'numeric',
              onChangeText: text =>
                setFieldValue('household_served', numericOnly(text)),
            })}
            {renderInput('house_locality', getLabel('House Locality / Address'))}
            <View style={styles.imageRow}>
              <Text numberOfLines={1} style={styles.fileName}>
                {houseImageFile?.name || getLabel('No house image selected')}
              </Text>
              <Button mode="outlined" onPress={pickHouseImage}>
                {getLabel('Pick Image')}
              </Button>
            </View>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}>
              {saveLabel}
            </Button>
          </>
        )}
      </ScrollView>
      {showMetadataOverlay && (
        <View style={styles.overlay}>
          {isInitialLoading ? (
            <>
              <ActivityIndicator size="large" />
              <Text style={styles.overlayText}>
                {getLabel('Loading form options')}
              </Text>
            </>
          ) : (
            <>
              <HelperText type="error">{metadataError}</HelperText>
              <Button mode="outlined" onPress={retry}>
                {getLabel('Retry')}
              </Button>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default BuildingDraftForm;

const styles = StyleSheet.create({
  formRoot: {
    flex: 1,
  },
  content: {
    padding: SPACINGS.md,
    gap: SPACINGS.sm,
    paddingBottom: SPACINGS.xl,
  },
  inputWrap: {
    marginTop: 4,
  },
  imageRow: {
    marginTop: 8,
    gap: 10,
  },
  fileName: {
    color: COLORS.dark,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACINGS.lg,
    gap: SPACINGS.md,
  },
  overlayText: {
    marginTop: SPACINGS.sm,
    fontSize: 16,
    textAlign: 'center',
  },
});
