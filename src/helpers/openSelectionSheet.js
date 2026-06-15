import {SheetManager} from 'react-native-actions-sheet';

import {kSheets} from '../sheets';

export const openSelectionSheet = async ({
  title,
  options,
  selectedValue,
  searchable = true,
  initialVisibleLimit,
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
    },
  });

  return payload?.value !== undefined ? String(payload.value) : undefined;
};
