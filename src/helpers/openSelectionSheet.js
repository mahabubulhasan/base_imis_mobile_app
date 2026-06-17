import {SheetManager} from 'react-native-actions-sheet';

import {kSheets} from '../sheets';

// Opens the selection sheet and resolves to the chosen option as
// {value, label} (or undefined if dismissed). Supports both static `options`
// and remote mode via `loader` (+ serverMinChars/prefetch/initialOptions/allowRawEntry).
export const openSelectionSheet = async ({
  title,
  options,
  selectedValue,
  searchable = true,
  initialVisibleLimit,
  loader,
  initialOptions,
  serverMinChars,
  prefetch,
  allowRawEntry,
}) => {
  const selectedOption = options?.find(
    item => String(item.value) === String(selectedValue),
  );

  const payload = await SheetManager.show(kSheets.selectionSheet, {
    payload: {
      title,
      options,
      selectedOption,
      searchable,
      ...(initialVisibleLimit != null ? {initialVisibleLimit} : {}),
      ...(loader ? {loader} : {}),
      ...(initialOptions != null ? {initialOptions} : {}),
      ...(serverMinChars != null ? {serverMinChars} : {}),
      ...(prefetch != null ? {prefetch} : {}),
      ...(allowRawEntry != null ? {allowRawEntry} : {}),
    },
  });

  if (payload?.value === undefined) return undefined;
  return {value: String(payload.value), label: payload.label};
};
