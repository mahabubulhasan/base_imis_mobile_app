import React, {useCallback, useEffect, useRef, useState} from "react";
import {Platform, ToastAndroid} from "react-native";
import {useSelector} from "react-redux";

import SelectionInput from "./SelectionInput";
import {openSelectionSheet} from "../../helpers/openSelectionSheet";
import {getLookupField} from "../../helpers/buildingLookupFields";
import * as lookupCache from "../../helpers/lookupCache";

// Reusable controller for a server-backed building form field. Reads its policy
// from buildingLookupFields, owns its display label (proxy-cache → server →
// raw value), gates on required context, and opens the selection sheet in remote
// mode. Parent keeps storing only the value via onChange(value).
const RemoteSelectionInput = ({
  field,
  label,
  title,
  value,
  values = {},
  error,
  disabled = false,
  onChange,
}) => {
  const config = getLookupField(field);
  const {contentsLabel} = useSelector(state => state.auth);
  const getLabel = useCallback(key => contentsLabel?.[key] || key, [contentsLabel]);

  const [displayLabel, setDisplayLabel] = useState("");
  const resolveReqRef = useRef(0);

  const context = config ? config.context(values) : {};
  const cacheKey = config ? config.cacheKey(context) : "";
  const isEnabled =
    !disabled && (config?.enabled ? config.enabled(values) : true);

  const hasValue = value !== undefined && value !== null && String(value).trim() !== "";

  // Resolve the current value's display label: cache first, then server, with
  // the raw value as an immediate fallback.
  useEffect(() => {
    if (!config || !hasValue) {
      setDisplayLabel("");
      return;
    }

    const cached = lookupCache.resolveLabel(cacheKey, value);
    if (cached) {
      setDisplayLabel(cached);
      return;
    }

    setDisplayLabel(String(value));

    const reqId = ++resolveReqRef.current;
    (async () => {
      try {
        // 'q' fields are code-keyed — search by the value itself (one page is
        // enough). 'all' fields are id-keyed (e.g. LIC) — the value won't match
        // a text query, so fetch the full list (no limit) to find its label.
        const params =
          config.resolveBy === "q"
            ? {...context, q: value, limit: config.limit}
            : {...context};
        const opts = await config.search(params);
        if (reqId !== resolveReqRef.current) return;
        lookupCache.merge(cacheKey, opts);
        const found = opts.find(o => String(o.value) === String(value));
        if (found) setDisplayLabel(found.label);
      } catch {
        // offline / not found — keep the raw value as the label
      }
    })();
    // context is captured via cacheKey; re-running on value/key change is enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, value, cacheKey, hasValue]);

  const openPicker = async () => {
    if (!config) return;
    if (!isEnabled) {
      if (Platform.OS === "android") {
        ToastAndroid.show(
          getLabel("Select the required field first"),
          ToastAndroid.SHORT,
        );
      }
      return;
    }

    const ctx = config.context(values);
    const key = config.cacheKey(ctx);
    const loader = async q => {
      const opts = await config.search({...ctx, q, limit: config.limit});
      lookupCache.merge(key, opts);
      return opts;
    };

    const selected = await openSelectionSheet({
      title: title || label,
      selectedValue: value,
      searchable: true,
      loader,
      initialOptions: lookupCache.get(key) || [],
      initialVisibleLimit: config.limit,
      serverMinChars: config.serverMinChars,
      prefetch: config.prefetch,
      allowRawEntry: config.allowRawEntry,
    });

    if (selected) {
      lookupCache.merge(key, [{value: selected.value, label: selected.label}]);
      setDisplayLabel(selected.label);
      onChange(selected.value);
    }
  };

  return (
    <SelectionInput
      label={label}
      value={displayLabel}
      error={error}
      onPress={openPicker}
    />
  );
};

export default RemoteSelectionInput;
