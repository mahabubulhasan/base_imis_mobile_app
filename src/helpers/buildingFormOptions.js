export const getOptionLabel = (options, value) => {
  const found = options?.find(item => String(item.value) === String(value));
  return found?.label ?? '';
};

export const getYesNoOptions = getLabel => [
  {label: getLabel('YES'), value: '1'},
  {label: getLabel('NO'), value: '0'},
];
