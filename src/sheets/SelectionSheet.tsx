import React, {useEffect, useMemo, useState} from 'react';
import {Dimensions, FlatList, StyleSheet, View} from 'react-native';
import ActionSheet, {
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import {Checkbox, Text, TextInput} from 'react-native-paper';

import SheetHeader from '../components/Sheets/SheetHeader';

export interface ISelectionSheetProps {
  title: string;
  options: ISelectionSheetOption[];
  selectedOption?: ISelectionSheetOption;
  initialVisibleLimit?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
}
export interface ISelectionSheetOption {
  label: string;
  value: string | number;
  data?: any;
}

export default function SelectionSheet({
  sheetId,
  payload,
}: SheetProps<'selection-sheet'>) {
  const {
    options = [],
    title,
    selectedOption,
    initialVisibleLimit = 20,
    searchable = true,
    searchPlaceholder = 'Search',
    emptyLabel = 'No options found',
  } = payload || {};
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setQuery('');
    setDebouncedQuery('');
  }, [title]);

  const visibleOptions = useMemo(() => {
    const normalized = String(debouncedQuery).toLowerCase();
    if (!normalized) {
      return options.slice(0, Math.max(1, initialVisibleLimit));
    }
    return options.filter(item => {
      const label = String(item?.label ?? '').toLowerCase();
      const value = String(item?.value ?? '').toLowerCase();
      return label.includes(normalized) || value.includes(normalized);
    });
  }, [debouncedQuery, initialVisibleLimit, options]);

  const onPressItem = (item: ISelectionSheetOption) => {
    SheetManager.hide(sheetId, {
      payload: item,
    });
  };

  const onPressHeader = () => {
    SheetManager.hide(sheetId);
  };

  return (
    <ActionSheet
      id={sheetId}
      gestureEnabled={true}
      headerAlwaysVisible={false}
      indicatorStyle={{
        width: 50,
        height: 2.81,
        marginTop: 10,
        marginBottom: 8,
        borderRadius: 2,
      }}
      containerStyle={styles.sheetContainer}
      overlayColor={'rgba(0,0,0,0.5)'}>
      <SheetHeader title={title || ''} onPress={onPressHeader} />

      <View style={styles.container}>
        {searchable && (
          <View style={styles.searchWrap}>
            <TextInput
              mode="outlined"
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              dense
              style={styles.searchInput}
            />
          </View>
        )}
        <FlatList
          showsVerticalScrollIndicator={false}
          data={visibleOptions}
          ListEmptyComponent={<Text style={styles.emptyText}>{emptyLabel}</Text>}
          renderItem={({item}) => {
            const selected = item.value === selectedOption?.value;

            return (
              <Checkbox.Item
                mode="ios"
                label={item.label}
                status={selected ? 'checked' : 'unchecked'}
                style={styles.item}
                onPress={() => onPressItem(item)}
              />
            );
          }}
        />
      </View>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    maxHeight: Dimensions.get('screen').height,
    paddingBottom: 16,
  },
  searchWrap: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
  },
  item: {
    paddingVertical: 4,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
