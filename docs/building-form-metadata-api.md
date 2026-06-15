# Building Form Metadata API — Mobile App Contract

This document describes **dropdown / lookup metadata** used by the IMIS mobile building **Create** and **Edit** forms. It is derived from the current React Native implementation and defines the target API shape for consolidating metadata into a **single endpoint** prefetched when the building map loads.

---

## 1. Current state (before refactor)

| Screen | File | Metadata source today | Building values source |
|--------|------|----------------------|------------------------|
| Create | `src/screens/root/CreateBuildingAfterDrawScreen.js` | `GET building-info/buildings/create-data` | User input + local draft |
| Edit (WMS) | `src/screens/root/BuildingEditScreen.js` | Same keys bundled inside `GET building-info/buildings/{bin}/edit-data` | Nested objects in same response |
| Edit (local draft) | `BuildingEditScreen` (`source: "local"`) | None (only temp/tax code fields) | Redux `buildingsData[index]` |

### Current endpoints

```
GET  building-info/buildings/create-data
GET  building-info/buildings/{bin}/edit-data
POST building-info/update/{bin}
```

---

## 2. Target state (after refactor)

### 2.1 Unified metadata endpoint (prefetch on map load)

Load **once**, asynchronously, when `BuildingMapScreen` mounts. Store in Redux (or equivalent cache). **Create** and **Edit** forms read dropdown options from cache — they do **not** call metadata APIs on screen open.

```
GET building-info/buildings/form-metadata
```

**Response envelope (match existing app convention):**

```json
{
  "data": { /* metadata object — see §4 */ }
}
```

### 2.2 Slim edit endpoint (building record only)

`edit-data` should return **only the selected WMS building’s saved field values** plus **building-specific containment records**. It must **not** repeat global dropdown lists.

```
GET building-info/buildings/{bin}/edit-data
```

**Response envelope:**

```json
{
  "data": {
    "building": { /* flat or nested field values — see §6 */ },
    "buildingSurvey": { /* optional alternate shape */ },
    "containment": [ /* building-specific containment cards — see §6.2 */ ]
  }
}
```

### 2.3 Endpoints to deprecate

| Endpoint | Action |
|----------|--------|
| `GET building-info/buildings/create-data` | **Remove** after mobile uses `form-metadata` |
| Metadata portion of `GET .../edit-data` | **Remove** — move keys to `form-metadata` |

---

## 3. Metadata inventory (full union)

**15 global metadata keys** exist across create + edit today. **12 are shared**. **3 are create-only**. **1 edit key is loaded but unused** in the mobile UI.

### 3.1 Summary table

| API key | Type | Create form | Edit form | Form field(s) | Notes |
|---------|------|:-----------:|:---------:|---------------|-------|
| `ward` | `Record<id, label>` | ✅ | ✅ | `ward` | |
| `road_code` | `Record<id, label>` | ✅ | ✅ | `road_code` | |
| `structure_type` | `Record<id, label>` | ✅ | ✅ | `structure_type_id` | |
| `functional_use` | `Record<id, label>` | ✅ | ✅ | `functional_use_id` | |
| `usecatgsJson` | `Record<functional_use_id, Record<id, label>>` | ✅ | ✅ | `use_category_id` | Dependent on `functional_use_id` |
| `water_source` | `Record<id, label>` | ✅ | ✅ | `water_source_id` | |
| `toiletConnection` | `Record<id, label>` | ✅ | ✅ | `sanitation_system_id` | Label in UI: "Sanitation System" / "Toilet Connection" |
| `defecationPlace` | `Record<id, label>` | ✅ | ✅ | `defecation_place` | Shown when toilet absent |
| `licNames` | `Record<id, label>` | ✅ | ✅ | `lic_id` | Label in UI: "LIC Name" |
| `ctpt` | `Record<id, label>` | ✅ | ✅ | `ctpt_name` | Shown when `defecation_place === "9"` |
| `sewer_code` | `Record<id, label>` | ✅ | ✅ | `sewer_code` | Shown when `sanitation_system_id === "1"` |
| `drain_code` | `Record<id, label>` | ✅ | ✅ | `drain_code` | Shown when `sanitation_system_id === "2"` |
| `buildingBin` | `Record<id, label>` | ✅ | ❌ | `building_associated_to` | Create: dropdown. Edit: **plain text** input |
| `bin` | `Record<id, label>` | ✅ | ❌ | `build_contain` | Preconnected containment BIN; create only |
| `waterSupply` | `Record<id, label>` | ✅ | ❌ | `watersupply_pipe_code` | Create: dropdown. Edit: **plain text** input |
| `capitalizedctpt` | `Record<id, label>` | ✅ (fallback) | ❌ | `ctpt_name` | Create uses `capitalizedctpt \|\| ctpt`; prefer single `ctpt` key |
| `containment_id` | `Record<id, label>` | ❌ | ⚠️ loaded, **unused** | — | Parsed in edit screen but no dropdown bound; safe to omit from mobile contract unless backend needs it elsewhere |

### 3.2 NOT metadata (do not put in `form-metadata`)

| Item | Source today | Belongs in |
|------|--------------|------------|
| `containment` (array of building containment records) | `edit-data` | `edit-data` only — **per-building** |
| `building`, `buildingSurvey`, `editData`, `formData`, `values` | `edit-data` | `edit-data` only — **per-building** |
| Yes/No options (`1`/`0`) | Hardcoded in `BuildingEditScreen` | Mobile client |
| Gender options (`0`/`1`/`2`) | Hardcoded in `BuildingEditScreen` | Mobile client |

---

## 4. Unified `form-metadata` response — detailed keys

All dropdown maps use the same shape. Keys are **stringified IDs**; values are **display labels**.

### 4.1 Standard option map

```typescript
type OptionMap = Record<string, string>;
// Example: { "1": "Ward 1", "2": "Ward 2" }
```

Mobile normalizes to:

```typescript
type MobileOption = { value: string; label: string };
```

### 4.2 `usecatgsJson` (dependent dropdown)

Maps **functional use ID** → nested option map for **use category**.

```json
{
  "usecatgsJson": {
    "1": { "10": "Residential", "11": "Mixed" },
    "2": { "20": "Commercial" }
  }
}
```

May be returned as a **JSON string** or **object** (mobile parses both today).

**Client behavior:** When user selects `functional_use_id`, mobile filters `usecatgsJson[functional_use_id]` for the Use Category dropdown and clears `use_category_id`.

### 4.3 Recommended canonical response body

Use **snake_case** for new keys. Mobile can map legacy camelCase during migration.

```json
{
  "data": {
    "ward": {},
    "road_code": {},
    "structure_type": {},
    "functional_use": {},
    "usecatgs_json": {},
    "water_source": {},
    "toilet_connection": {},
    "defecation_place": {},
    "lic_names": {},
    "ctpt": {},
    "sewer_code": {},
    "drain_code": {},
    "building_bin": {},
    "preconnected_bin": {},
    "water_supply": {}
  }
}
```

### 4.4 Legacy key mapping (current mobile ↔ recommended)

| Current key (create-data / edit-data) | Recommended key | Used in create | Used in edit |
|---------------------------------------|-----------------|:--------------:|:------------:|
| `ward` | `ward` | ✅ | ✅ |
| `road_code` | `road_code` | ✅ | ✅ |
| `structure_type` | `structure_type` | ✅ | ✅ |
| `functional_use` | `functional_use` | ✅ | ✅ |
| `usecatgsJson` | `usecatgs_json` | ✅ | ✅ |
| `water_source` | `water_source` | ✅ | ✅ |
| `toiletConnection` | `toilet_connection` | ✅ | ✅ |
| `defecationPlace` | `defecation_place` | ✅ | ✅ |
| `licNames` | `lic_names` | ✅ | ✅ |
| `ctpt` / `capitalizedctpt` | `ctpt` | ✅ | ✅ |
| `sewer_code` | `sewer_code` | ✅ | ✅ |
| `drain_code` | `drain_code` | ✅ | ✅ |
| `buildingBin` | `building_bin` | ✅ | ❌ |
| `bin` | `preconnected_bin` | ✅ | ❌ |
| `waterSupply` | `water_supply` | ✅ | ❌ |

**Backend note:** `building_bin`, `preconnected_bin`, and `water_supply` can remain in the unified metadata response even though edit does not use them as dropdowns today — they keep create behavior unchanged and allow future edit UI parity.

---

## 5. Create form — metadata usage map

**Screen:** `CreateBuildingAfterDrawScreen.js`  
**Loader:** `fetchCreateData()` → `getBuildingCreateData()`

| UI label (CMS key) | Form field | Metadata key | Conditional visibility |
|--------------------|------------|--------------|------------------------|
| Ward | `ward` | `ward` | Always |
| Road Code | `road_code` | `road_code` | Always |
| Structure Type | `structure_type_id` | `structure_type` | Always |
| Functional Use | `functional_use_id` | `functional_use` | Always |
| Use Category | `use_category_id` | `usecatgsJson[functional_use_id]` | When functional use requires category |
| Water Source | `water_source_id` | `water_source` | Always |
| Building Associated To | `building_associated_to` | `buildingBin` | `main_building === "0"` |
| LIC ID | `lic_id` | `licNames` | `lic_status === "1"` |
| Sanitation System | `sanitation_system_id` | `toiletConnection` | `toilet_status === "1"` |
| Defecation Place | `defecation_place` | `defecationPlace` | `toilet_status === "0"` |
| CTPT Name | `ctpt_name` | `capitalizedctpt` or `ctpt` | `defecation_place === "9"` |
| Build Contain | `build_contain` | `bin` | Sanitation system requires containment |
| Sewer Code | `sewer_code` | `sewer_code` | `sanitation_system_id === "1"` |
| Drain Code | `drain_code` | `drain_code` | `sanitation_system_id === "2"` |
| Water Supply Pipe Code | `watersupply_pipe_code` | `waterSupply` | `water_source_id === "1"` (create) |

Non-dropdown fields (text, date, switch, image) do **not** use metadata API.

---

## 6. Edit form — metadata vs building data

**Screen:** `BuildingEditScreen.js` (WMS path: `source === "wms"`)

### 6.1 Metadata keys (move to `form-metadata`)

Same 12 shared keys as §3.1. Edit reads them from `editMeta` today; after refactor, read from Redux cache.

| UI section | Form field | Metadata key |
|------------|------------|--------------|
| Building Information | `ward` | `ward` |
| Building Information | `road_code` | `road_code` |
| Building Information | `structure_type_id` | `structure_type` |
| Building Information | `functional_use_id` | `functional_use` |
| Building Information | `use_category_id` | `usecatgsJson[functional_use_id]` |
| LIC Information | `lic_id` | `licNames` |
| Water Source | `water_source_id` | `water_source` |
| Sanitation | `sanitation_system_id` | `toiletConnection` |
| Sanitation | `defecation_place` | `defecationPlace` |
| Sanitation | `ctpt_name` | `ctpt` |
| Sanitation | `sewer_code` | `sewer_code` |
| Sanitation | `drain_code` | `drain_code` |

**Edit differences from create (UI only, not metadata):**

- `building_associated_to` — text input, not `buildingBin` dropdown
- `watersupply_pipe_code` — text input, not `waterSupply` dropdown
- No `build_contain` field on edit form

### 6.2 Building data keys (stay in `edit-data`)

These are **saved values** for the selected BIN, not global lookups.

Mobile merges from (first non-empty wins via `pickFirst`):

- `body`
- `data`
- `data.building`
- `data.buildingSurvey`
- `data.editData`
- `data.formData`
- `data.values`

**Normalized form fields** (`normalizeBuildingValues` in `BuildingEditScreen.js`):

| Form field | Accepted API aliases |
|------------|---------------------|
| `owner_name` | `owner_name`, `ownerName` |
| `nid` | `nid`, `owner_nid` |
| `owner_gender` | `owner_gender`, `gender` |
| `owner_contact` | `owner_contact`, `contact_number`, `ownerPhone` |
| `main_building` | `main_building`, `is_main_building`, `mainBuilding` |
| `building_associated_to` | `building_associated_to`, `bin_of_main_building`, `associated_building_bin` |
| `ward` | `ward`, `ward_no`, `wardNumber` |
| `road_code` | `road_code`, `roadCode` |
| `house_number` | `house_number`, `temp_building_code`, `bin` |
| `house_locality` | `house_locality`, `house_address`, `houseAddress` |
| `tax_code` | `tax_code`, `taxCode` |
| `structure_type_id` | `structure_type_id`, `structure_type`, `structureType` |
| `surveyed_date` | `surveyed_date`, `surveyedDate` |
| `construction_year` | `construction_year`, `construction_date`, `constructionDate` |
| `floor_count` | `floor_count`, `num_of_floors`, `numOfFloors` |
| `functional_use_id` | `functional_use_id`, `functional_use`, `functionalUseOfBuilding` |
| `use_category_id` | `use_category_id`, `use_category`, `useCategory` |
| `office_business_name` | `office_business_name`, `office_name`, `officeName` |
| `household_served` | `household_served`, `num_of_households`, `numOfHouseholds` |
| `population_served` | `population_served`, `population_of_building`, `populationOfBuilding` |
| `male_population` | `male_population`, `malePopulation` |
| `female_population` | `female_population`, `femalePopulation` |
| `other_population` | `other_population`, `otherPopulation` |
| `diff_abled_male_pop` | `diff_abled_male_pop`, `damp` |
| `diff_abled_female_pop` | `diff_abled_female_pop`, `dafp` |
| `diff_abled_others_pop` | `diff_abled_others_pop`, `daop` |
| `low_income_hh` | `low_income_hh`, `is_low_income_house`, `isLowIncomeHouse` |
| `lic_status` | `lic_status`, `located_in_lic`, `locatedInLic` |
| `lic_id` | `lic_id`, `lic_community`, `licCommunity` |
| `water_source_id` | `water_source_id`, `main_drinking_source`, `mainDrinkingSource` |
| `water_customer_id` | `water_customer_id` |
| `watersupply_pipe_code` | `watersupply_pipe_code` |
| `well_presence_status` | `well_presence_status`, `well_in_premises`, `wellInPremises` |
| `distance_from_well` | `distance_from_well` |
| `swm_customer_id` | `swm_customer_id`, `swmCustomerId` |
| `toilet_status` | `toilet_status`, `presence_of_toilet`, `presenceOfToilet` |
| `toilet_count` | `toilet_count` |
| `household_with_private_toilet` | `household_with_private_toilet` |
| `population_with_private_toilet` | `population_with_private_toilet` |
| `sanitation_system_id` | `sanitation_system_id`, `building_sanitation_system` |
| `defecation_place` | `defecation_place` |
| `ctpt_name` | `ctpt_name` |
| `build_contain` | `build_contain` |
| `desludging_vehicle_accessible` | `desludging_vehicle_accessible`, `vacutug_accessible` |
| `sewer_code` | `sewer_code` |
| `drain_code` | `drain_code` |

### 6.3 `containment` array (per-building, read-only in edit UI)

**Not** global metadata. Displayed as cards at bottom of edit form.

```typescript
type ContainmentRecord = {
  containment_id?: string | number;
  id?: string | number;
  toilet_name?: string;
  sanitation_system?: string;
  containment_volume?: string | number;
  volume?: string | number;
  containment_location?: string;
  location?: string;
};
```

---

## 7. Conditional field rules (mobile)

Backend validation should align with these mobile visibility rules.

### 7.1 Create (`getVisibleConditionalFields` in `buildingDraft.js`)

| Field | Visible when |
|-------|--------------|
| `use_category_id` | Functional use requires category |
| `building_associated_to` | `main_building === "0"` |
| `lic_id` | `lic_status === "1"` |
| `watersupply_pipe_code` | `water_source_id === "1"` |
| `toilet_count`, `household_with_private_toilet`, `population_with_private_toilet`, `sanitation_system_id` | `toilet_status === "1"` |
| `defecation_place` | `toilet_status === "0"` |
| `ctpt_name` | `defecation_place === "9"` |
| `build_contain` | `sanitation_system_id === "11"` |
| `sewer_code` | `sanitation_system_id === "1"` |
| `drain_code` | `sanitation_system_id === "2"` |

### 7.2 Edit (WMS)

| Field | Visible when |
|-------|--------------|
| `building_associated_to` | `main_building !== "1"` |
| `lic_id` | `lic_status === "1"` |
| `water_customer_id`, `watersupply_pipe_code` | `water_source_id === "5"` |
| `distance_from_well` | `well_presence_status === "1"` |
| Toilet block fields | `toilet_status === "1"` |
| `sewer_code` | toilet + `sanitation_system_id === "1"` |
| `drain_code` | toilet + `sanitation_system_id === "2"` |
| `defecation_place` | `toilet_status === "0"` |
| `ctpt_name` | `defecation_place === "9"` |

**Note:** Create uses `water_source_id === "1"` for water pipe; Edit uses `water_source_id === "5"`. Confirm correct ID with business rules.

---

## 8. Mobile prefetch flow (planned)

```
BuildingMapScreen mount
  └─ background: GET building-info/buildings/form-metadata
       └─ dispatch to Redux: map.buildingFormMetadata
            ├─ CreateBuildingAfterDrawScreen reads cache (no screen-level fetch)
            └─ BuildingEditScreen reads cache for dropdowns
                 └─ on open (WMS): GET .../{bin}/edit-data for values + containment only
```

**Cache considerations:**

- Auth-scoped (same token as other building APIs)
- Optional `ETag` / `updated_at` for refresh on next map visit
- If metadata missing when form opens, show error + retry prefetch (do not call deprecated `create-data`)

---

## 9. Example responses

### 9.1 `GET building-info/buildings/form-metadata`

```json
{
  "data": {
    "ward": { "1": "Ward 1", "2": "Ward 2" },
    "road_code": { "101": "Road A", "102": "Road B" },
    "structure_type": { "1": "Permanent", "2": "Semi-permanent" },
    "functional_use": { "1": "Residential", "2": "Commercial" },
    "usecatgs_json": {
      "1": { "10": "Single family", "11": "Apartment" },
      "2": { "20": "Retail" }
    },
    "water_source": { "1": "Pipeline", "5": "Municipal/Public Water Supply" },
    "toilet_connection": { "1": "Sewer", "2": "Drain", "11": "Containment" },
    "defecation_place": { "1": "Open field", "9": "Community toilet (CTPT)" },
    "lic_names": { "3": "LIC Area 3" },
    "ctpt": { "CTPT-01": "CTPT Ward 1" },
    "sewer_code": { "S001": "Sewer line 1" },
    "drain_code": { "D001": "Drain 1" },
    "building_bin": { "BIN001": "Main building BIN001" },
    "preconnected_bin": { "PC001": "Preconnected containment" },
    "water_supply": { "WS001": "Pipe WS001" }
  }
}
```

### 9.2 `GET building-info/buildings/{bin}/edit-data` (after slimming)

```json
{
  "data": {
    "building": {
      "owner_name": "Jane Doe",
      "owner_gender": "1",
      "owner_contact": "01700000000",
      "ward": "1",
      "road_code": "101",
      "structure_type_id": "1",
      "functional_use_id": "1",
      "use_category_id": "10",
      "water_source_id": "5",
      "toilet_status": "1",
      "sanitation_system_id": "1",
      "sewer_code": "S001"
    },
    "containment": [
      {
        "containment_id": "C-100",
        "toilet_name": "Septic tank",
        "containment_volume": "2000",
        "containment_location": "Backyard"
      }
    ]
  }
}
```

---

## 10. Backend implementation checklist

- [ ] Add `GET building-info/buildings/form-metadata` returning §4.3 keys
- [ ] Merge logic from existing `create-data` and metadata portion of `edit-data`
- [ ] Deduplicate `ctpt` / `capitalizedctpt` into single `ctpt`
- [ ] Slim `GET building-info/buildings/{bin}/edit-data` to §6 only
- [ ] Keep `POST building-info/update/{bin}` unchanged
- [ ] Deprecate `GET building-info/buildings/create-data` after mobile ships prefetch
- [ ] Document auth header: same Bearer token as existing building endpoints
- [ ] Return `Accept: application/json`

---

## 11. Source file references (mobile)

| Purpose | Path |
|---------|------|
| Create form + metadata load | `src/screens/root/CreateBuildingAfterDrawScreen.js` |
| Edit form + metadata load | `src/screens/root/BuildingEditScreen.js` |
| API client | `src/service/building_service.js` |
| Create conditional visibility | `src/helpers/buildingDraft.js` |
| Map screen (prefetch target) | `src/screens/root/BuildingMapScreen.js` |
| URL constants | `src/core/constants/urls.js` |

---

## 12. Venn diagram (metadata keys)

```
                    ┌─────────────────────────────────────┐
                    │         UNIFIED form-metadata        │
                    │  ward, road_code, structure_type,    │
                    │  functional_use, usecatgs_json,      │
                    │  water_source, toilet_connection,    │
                    │  defecation_place, lic_names, ctpt,  │
                    │  sewer_code, drain_code              │
                    └─────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼─────────┐   ┌─────────▼─────────┐   ┌────────▼────────┐
    │  CREATE-ONLY       │   │  SHARED (12)       │   │  EDIT-ONLY       │
    │  building_bin      │   │  (all rows above)  │   │  containment[]   │
    │  preconnected_bin  │   │                    │   │  (per-building,  │
    │  water_supply      │   │                    │   │   not metadata)  │
    │  (+ capitalizedctpt│   │                    │   │                  │
    │     legacy alias)  │   │                    │   │  containment_id  │
    └────────────────────┘   └────────────────────┘   │  (unused in UI)  │
                                                        └──────────────────┘
```

---

*Generated from mobile codebase analysis. Branch: building create/edit forms as of React Native 0.74.4.*

---

## Mobile implementation status

Implemented in the React Native app:

- `GET building-info/buildings/form-metadata` prefetched on `BuildingMapScreen` mount via `fetchBuildingFormMetadata` thunk
- Cached in Redux: `map.buildingFormMetadata`, `map.buildingFormMetadataStatus`, `map.buildingFormMetadataError`
- Shared helpers: `src/helpers/buildingFormMetadata.js`, `buildingFormOptions.js`, `openSelectionSheet.js`
- Hook: `src/hooks/useBuildingFormMetadata.js`
- Create and Edit WMS forms read dropdowns from cache; Edit loads values from slim `edit-data` only
- Deprecated `create-data` is no longer called by the mobile app
