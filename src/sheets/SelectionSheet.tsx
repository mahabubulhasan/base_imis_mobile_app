import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Dimensions, FlatList, StyleSheet, View} from 'react-native';
import ActionSheet, {
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import {Checkbox, Text, TextInput} from 'react-native-paper';
import {useSelector} from 'react-redux';

import SheetHeader from '../components/Sheets/SheetHeader';

export interface ISelectionSheetOption {
  label: string;
  value: string | number;
  data?: any;
}

export interface ISelectionSheetProps {
  title: string;
  options?: ISelectionSheetOption[];
  selectedOption?: ISelectionSheetOption;
  initialVisibleLimit?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  // Remote (server-backed) mode. When `loader` is provided the sheet fetches
  // options on demand instead of filtering the static `options` array.
  loader?: (query: string) => Promise<ISelectionSheetOption[]>;
  initialOptions?: ISelectionSheetOption[]; // proxy-cache seed shown instantly
  serverMinChars?: number; // min query length before querying the server
  prefetch?: boolean; // load the list on open with an empty query
  allowRawEntry?: boolean; // offer "Use <typed>" when nothing matches (offline)
}

const filterOptions = (list: ISelectionSheetOption[], q: string) => {
  const normalized = q.toLowerCase();
  if (!normalized) return list;
  return list.filter(item => {
    const label = String(item?.label ?? '').toLowerCase();
    const value = String(item?.value ?? '').toLowerCase();
    return label.includes(normalized) || value.includes(normalized);
  });
};

export default function SelectionSheet({
  sheetId,
  payload,
}: SheetProps<'selection-sheet'>) {
  const contentsLabel = useSelector(
    (state: {auth?: {contentsLabel?: Record<string, string>}}) => state.auth?.contentsLabel,
  );
  const getLabel = useCallback(
    (key: string) => contentsLabel?.[key] || key,
    [contentsLabel],
  );

  const {
    options = [],
    title,
    selectedOption,
    initialVisibleLimit = 20,
    searchable = true,
    searchPlaceholder: searchPlaceholderProp,
    emptyLabel: emptyLabelProp,
    loader,
    initialOptions = [],
    serverMinChars = 1,
    prefetch = false,
    allowRawEntry = false,
  } = payload || {};

  const isRemote = typeof loader === 'function';

  const searchPlaceholder = searchPlaceholderProp ?? getLabel('Search');
  const emptyLabel = emptyLabelProp ?? getLabel('No options found');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Remote-mode state: `baseOptions` is the prefetched/cached set used for
  // below-threshold local filtering; `serverOptions` is the latest query result.
  const [baseOptions, setBaseOptions] = useState<ISelectionSheetOption[]>(initialOptions);
  const [serverOptions, setServerOptions] = useState<ISelectionSheetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const baseRef = useRef(baseOptions);
  useEffect(() => {
    baseRef.current = baseOptions;
  }, [baseOptions]);

  const cancelServer = () => {
    requestIdRef.current++; // invalidate any in-flight server query
    setServerOptions([]);
    setLoading(false);
  };

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

  const runLoader = useCallback(
    async (q: string, target: 'base' | 'server') => {
      if (!loader) return;
      const reqId = ++requestIdRef.current;
      setLoading(true);
      try {
        const results = await loader(q);
        if (reqId !== requestIdRef.current) return; // stale response
        if (target === 'base') setBaseOptions(results);
        else setServerOptions(results);
      } catch {
        if (reqId !== requestIdRef.current) return;
        if (target === 'server') setServerOptions([]);
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    },
    [loader],
  );

  // Prefetch a page (no query) when the sheet opens in remote mode and the
  // cache seed is thin — fills the dropdown with the first `initialVisibleLimit`
  // rows for the current context (e.g. roads for the selected ward).
  useEffect(() => {
    if (isRemote && prefetch && initialOptions.length < initialVisibleLimit) {
      runLoader('', 'base');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cache-first search: filter the cached/prefetched set; only hit the server
  // when the query has no cache match (and meets the server's min length).
  useEffect(() => {
    if (!isRemote) return;
    const q = debouncedQuery;
    if (!q) {
      cancelServer();
      return;
    }
    if (filterOptions(baseRef.current, q).length > 0) {
      cancelServer(); // cache hit — no server call
      return;
    }
    if (q.length >= serverMinChars) {
      runLoader(q, 'server');
    } else {
      cancelServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, isRemote, serverMinChars]);

  const visibleOptions = useMemo(() => {
    if (isRemote) {
      const q = debouncedQuery;
      let list: ISelectionSheetOption[];
      if (!q) {
        list = baseOptions.slice(0, Math.max(1, initialVisibleLimit));
      } else {
        const localMatches = filterOptions(baseOptions, q);
        list = localMatches.length > 0 ? localMatches : serverOptions;
      }

      if (
        allowRawEntry &&
        q &&
        !loading &&
        !list.some(item => String(item.value) === q)
      ) {
        return [...list, {value: q, label: `${getLabel('Use')} "${q}"`}];
      }
      return list;
    }

    if (!debouncedQuery) {
      return options.slice(0, Math.max(1, initialVisibleLimit));
    }
    return filterOptions(options, debouncedQuery);
  }, [
    isRemote,
    debouncedQuery,
    serverMinChars,
    serverOptions,
    baseOptions,
    allowRawEntry,
    loading,
    options,
    initialVisibleLimit,
    getLabel,
  ]);

  const onPressItem = (item: ISelectionSheetOption) => {
    SheetManager.hide(sheetId, {payload: item});
  };

  const onPressHeader = () => {
    SheetManager.hide(sheetId);
  };

  const showTypeHint =
    isRemote &&
    !loading &&
    visibleOptions.length === 0 &&
    debouncedQuery.length < serverMinChars;

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
              right={loading ? <TextInput.Icon icon={() => <ActivityIndicator size={18} />} /> : undefined}
            />
          </View>
        )}
        <FlatList
          showsVerticalScrollIndicator={false}
          data={visibleOptions}
          keyExtractor={(item, index) => `${item.value}-${index}`}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.loader} />
            ) : (
              <Text style={styles.emptyText}>
                {showTypeHint
                  ? `${getLabel('Type at least')} ${serverMinChars} ${getLabel('characters to search')}`
                  : emptyLabel}
              </Text>
            )
          }
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
  loader: {
    paddingVertical: 20,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
