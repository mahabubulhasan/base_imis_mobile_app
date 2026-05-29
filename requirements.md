# IMIS Mobile App — Native Android (Kotlin) Requirements

> **App Name:** IMIS Base (Integrated Management Information System)
> **Target Platform:** Native Android (Kotlin + Jetpack Compose / View-based UI)
> **Purpose:** Municipal field data-collection app for building surveys, containment assessments, emptying service management, sludge collection, and sewer mapping.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Task 1 – Project Setup & Configuration](#task-1--project-setup--configuration)
3. [Task 2 – Networking Layer](#task-2--networking-layer)
4. [Task 3 – State Management & Persistence](#task-3--state-management--persistence)
5. [Task 4 – Authentication](#task-4--authentication)
6. [Task 5 – Navigation](#task-5--navigation)
7. [Task 6 – Home Screen](#task-6--home-screen)
8. [Task 7 – Building Map Screen](#task-7--building-map-screen)
9. [Task 8 – Create Building Form (After Draw)](#task-8--create-building-form-after-draw)
10. [Task 9 – Building Edit Screen](#task-9--building-edit-screen)
11. [Task 10 – Building Data Screen](#task-10--building-data-screen)
12. [Task 11 – KML Viewer Screen](#task-11--kml-viewer-screen)
13. [Task 12 – Containment Map Screen](#task-12--containment-map-screen)
14. [Task 13 – Containment Data Screen](#task-13--containment-data-screen)
15. [Task 14 – Application List Screen](#task-14--application-list-screen)
16. [Task 15 – Emptying Submission Screen](#task-15--emptying-submission-screen)
17. [Task 16 – Emptying Building Picker Screen](#task-16--emptying-building-picker-screen)
18. [Task 17 – Containment Assessment Screen](#task-17--containment-assessment-screen)
19. [Task 18 – Sludge Collection Screen](#task-18--sludge-collection-screen)
20. [Task 19 – Sewer Map Screen](#task-19--sewer-map-screen)
21. [Task 20 – Sewer Data Screen](#task-20--sewer-data-screen)
22. [Task 21 – Containment Viewer Screen](#task-21--containment-viewer-screen)
23. [Task 22 – Applicant Map Viewer Screen](#task-22--applicant-map-viewer-screen)
24. [Task 23 – Building Survey Screen (Legacy Form)](#task-23--building-survey-screen-legacy-form)
25. [Task 24 – Land Service Screens](#task-24--land-service-screens)
26. [Task 25 – About Us Screen](#task-25--about-us-screen)
27. [Task 26 – Shared UI Components](#task-26--shared-ui-components)
28. [Task 27 – Permissions Handling](#task-27--permissions-handling)
29. [Task 28 – Language / i18n Support](#task-28--language--i18n-support)
30. [Task 29 – Theme & Styling](#task-29--theme--styling)
31. [Data Models Reference](#data-models-reference)
32. [API Endpoints Reference](#api-endpoints-reference)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────┐
│  UI Layer (Jetpack Compose or XML Views)          │
│  – Screens / Fragments                            │
│  – Shared Components (Header, Spinner, Cards)     │
├──────────────────────────────────────────────────┤
│  ViewModel Layer (MVVM)                           │
│  – One ViewModel per major feature                │
├──────────────────────────────────────────────────┤
│  Repository Layer                                 │
│  – Remote: Retrofit API services                  │
│  – Local: DataStore / Room (persisted state)      │
├──────────────────────────────────────────────────┤
│  Data Layer                                       │
│  – Retrofit HTTP client + OkHttp interceptors     │
│  – Room DB (building drafts, containment drafts,  │
│    sewer drafts)                                  │
│  – DataStore Preferences (auth token, username,   │
│    permissions, current language, label cache)    │
└──────────────────────────────────────────────────┘
```

**Key patterns:**
- MVVM with StateFlow/LiveData
- Single-Activity with Jetpack Navigation (or multi-fragment)
- Bearer token injected by an OkHttp interceptor
- 401 interceptor auto-logs out and clears token
- Environment-specific base URLs via `BuildConfig` (dev / prod flavors)
- All locally saved field data is persisted in Room until manually uploaded

---

## Task 1 – Project Setup & Configuration

### 1.1 Build Variants
- Create two product flavors: `dev` and `prod`
- Each flavor defines its own `BASE_URL` via `BuildConfig`
- `applicationIdSuffix ".dev"` for the `dev` flavor
- Build types: `debug` and `release`

### 1.2 Dependencies
Add the following libraries (use latest stable versions):
| Library | Purpose |
|---------|---------|
| Retrofit 2 + OkHttp 4 | HTTP client |
| Gson / Moshi | JSON serialization |
| Room | Local persistence |
| DataStore (Preferences) | Simple key-value persistence |
| Hilt (Dagger) | Dependency injection |
| Jetpack Navigation | Screen navigation |
| Google Maps SDK | Map display |
| Glide / Coil | Image loading |
| Timber | Logging |
| Kotlin Coroutines + Flow | Async |
| Material Design 3 | UI components |
| CameraX / Intent camera | Photo capture |
| Gson for KML building | KML serialization |

### 1.3 Permissions (AndroidManifest.xml)
```
ACCESS_FINE_LOCATION
ACCESS_COARSE_LOCATION
INTERNET
READ_EXTERNAL_STORAGE  (Android ≤ 12)
WRITE_EXTERNAL_STORAGE (Android ≤ 12)
READ_MEDIA_IMAGES      (Android 13+)
CAMERA
```

### 1.4 Splash Screen
- Show app logo and "IMIS" branding on launch
- Hide splash once initialization is complete (fetch languages, etc.)
- Use the Splash Screen API (Android 12+) with a fade-out animation

### 1.5 Environment Config
- `BASE_URL` is read from `BuildConfig.BASE_URL`
- Max file size for uploads: **5 MB**
- Default active-opacity equivalent: `0.6` ripple alpha

---

## Task 2 – Networking Layer

### 2.1 Retrofit Client
- Base URL: `${BuildConfig.BASE_URL}/api/`
- Default `Content-Type: application/json` header
- Request timeout: **13 seconds**

### 2.2 Auth Interceptor
- Before every request, read the Bearer token from DataStore
- Inject `Authorization: Bearer <token>` header
- Inject `Accept: application/json` header
- Log request/response with Timber (debug builds only)

### 2.3 Response Interceptor / Error Handling
- On HTTP **401** where body message equals `"Unauthenticated."` OR error equals `"Unauthenticated. Invalid or missing token."`:
  - Show dialog: "Session expired, please log in again"
  - Clear stored token from DataStore → triggers navigation back to Login screen
- Propagate all other errors normally

### 2.4 API Service Interfaces
Create separate Retrofit interface files for each domain:
- `AuthApiService`
- `BuildingApiService`
- `SupervisorApiService` (emptying, sludge, assessment, drivers, etc.)
- `WmsApiService` (WMS link endpoints)
- `LanguageApiService`

---

## Task 3 – State Management & Persistence

### 3.1 Auth State (DataStore Preferences)
| Key | Type | Description |
|-----|------|-------------|
| `token` | String? | Bearer token; null = logged out |
| `username` | String? | Remembered username for "Remember Me" |
| `account` | JSON String? | Serialized user account object |
| `permissions` | JSON String? | Serialized permissions map |
| `currentLanguage` | String | Selected language code |
| `contentsLabel` | JSON String? | Cached translation map |
| `languages` | JSON String? | Cached list of available languages |

### 3.2 Map State (Room DB – `map_database`)

**Table: `building_drafts`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `feature_id` | TEXT UNIQUE NULLABLE | WMS feature ID (for upsert) |
| `temp_building_code` | TEXT | |
| `tax_code` | TEXT | |
| `coords_json` | TEXT | JSON array of lat/lng pairs |
| `path` | TEXT NULLABLE | Local KML file path |
| `kml_file_name` | TEXT NULLABLE | |
| `house_image_uri` | TEXT NULLABLE | |
| `house_image_type` | TEXT NULLABLE | |
| `house_image_name` | TEXT NULLABLE | |
| `upload_status` | TEXT | `pending` / `uploading` / `failed` / `uploaded` |
| `last_error` | TEXT NULLABLE | Last upload error message |
| `field_errors_json` | TEXT NULLABLE | JSON of field-level validation errors |
| `created_date` | TEXT | Formatted creation timestamp |
| `updated_at` | TEXT | ISO timestamp |
| *(all other building form fields)* | TEXT NULLABLE | Stored as text |

**Table: `containment_drafts`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `coords_json` | TEXT | JSON lat/lng point |
| `upload_status` | TEXT | `pending` / `uploading` / `failed` |
| `created_date` | TEXT | |
| *(containment form fields)* | TEXT NULLABLE | |

**Table: `sewer_drafts`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `bin` | TEXT | Building ID number |
| `sewer_code` | TEXT | |
| `upload_status` | TEXT | |
| `created_date` | TEXT | |

### 3.3 Building Coords State (In-Memory / ViewModel)
The current polygon being drawn on the Building Map is held in a ViewModel `StateFlow<List<LatLng>>`. It is also persisted to Room so it survives process death.

---

## Task 4 – Authentication

### 4.1 Sign-In Screen

**UI Elements:**
- App logo (top, centered)
- Municipality logo below app logo
- `Email Address` outlined text field (email keyboard, `autocapitalize: none`)
- `Password` outlined text field with show/hide eye icon toggle
- Inline validation error helper texts (shown below each field)
- `Remember Me` checkbox row (checkbox + label)
- `Log In` button (full width, contained, with loading indicator during login)
- App version number shown at bottom center

**Behavior:**
1. On screen load, if a remembered username exists in DataStore, pre-fill the Email field and check "Remember Me"
2. Validate on "Log In" press:
   - Email must not be empty → "Email address is required"
   - Password must not be empty → "Password is required"
   - Focus the offending field
3. POST to `/api/login` with `{ email, password }`
4. On success (`status: true`):
   - Store token in DataStore and save to the auth state
   - Store account object and permissions map
   - If "Remember Me" checked → store username in DataStore; else clear it
   - Navigation automatically switches to `RootStack` (token-guarded)
5. On failure:
   - If `error.login` present → show Alert "Login failed – Email or password is incorrect"
   - If `response.data.message` present → show Alert with the message
6. On network/server error → show Alert with error message

**Request Body:**
```json
{ "email": "user@example.com", "password": "secret" }
```
**Response:**
```json
{
  "status": true,
  "token": "<bearer_token>",
  "data": {
    "permissions": { "building-survey": true, "save-emptying-service": false, ... },
    ...account fields...
  }
}
```

### 4.2 Logout
- Call POST `/api/logout`
- Clear token from DataStore and auth state
- Navigate back to Sign-In screen

### 4.3 Route Guard
- On app start, read token and permissions from DataStore
- If both exist → show `RootStack`; otherwise → show Sign-In screen
- The 401 interceptor (Task 2.3) also triggers logout from anywhere in the app

---

## Task 5 – Navigation

### 5.1 Route List
Use Jetpack Navigation with a single nav graph containing:

| Route Name | Screen | Notes |
|------------|--------|-------|
| `home` | HomeScreen | Start destination |
| `about_us` | AboutUsScreen | |
| `building_map` | BuildingMapScreen | |
| `building_map_details` | BuildingMapDetailsScreen | |
| `building_edit` | BuildingEditScreen | args: `source: String` ("local"\|"wms"), `index: Int?`, `bin: String?` |
| `create_building_after_draw` | CreateBuildingAfterDrawScreen | |
| `containment_map` | ContainmentMapScreen | |
| `building_data` | BuildingDataScreen | |
| `containment_data` | ContainmentDataScreen | |
| `kml_viewer` | KmlViewerMapScreen | args: building draft item |
| `containment_viewer` | ContainmentViewerScreen | |
| `applicant_viewer` | ApplicantMapScreen | |
| `containment_assessment` | ContainmentAssessmentScreen | args: application item |
| `application_list` | ApplicationListScreen | args: `emptying: Bool`, `assessment: Bool`, `sludgeCollection: Bool` |
| `empty_submission` | EmptyingSubmissionScreen | args: application item |
| `sludge_collection` | SludgeCollectionScreen | args: application item |
| `emptying_building_picker` | EmptyingBuildingPickerScreen | args: `selectedBuildingId: String?` |
| `land_service` | LandApplicantListScreen | |
| `land_detail` | LandOwnerDetailScreen | |
| `building_survey` | BuildingSurveyScreen | |
| `sewage_map` | SewageMapScreen | |
| `sewage_data` | SewageDataScreen | |

### 5.2 App Bar / Header Component
A shared `AppHeader` composable/view used on every screen:
- Primary background color `#1E4D78` (or theme primary)
- White title text
- Back arrow (if not root screen) → `popBackStack()`
- Type `"home"` hides the back arrow
- Additional action icons injected per screen where needed (layers toggle, etc.)

---

## Task 6 – Home Screen

### 6.1 UI Layout
1. `AppHeader` (title = "Home", no back button, type "home")
2. `Profile` card: shows logged-in user's name and role/account details
3. Pull-to-refresh (calls `getPermissions()` on refresh)
4. Dashboard tile grid (2 columns, centered, wrapped)
5. Footer: "© {year} Laxmipur Municipality. All rights reserved."

### 6.2 Dashboard Tiles (Permission-Based)
Each tile shows an icon image and label. Show only if the user has the corresponding permission:

| Permission Key | Tile Label | Navigation Target |
|----------------|-----------|-------------------|
| `building-survey` | "Building Map" | `building_map` |
| `building-survey` | "Building Data" | `building_data` |
| `save-emptying-service` | "Emptying Service" | `application_list` (params: `emptying=true`) |
| `sludge-collection` | "Sludge Collection" | `application_list` (params: `sludgeCollection=true`) |
| `sewer-connection` | "Sewer Map" | `sewage_map` |
| `sewer-connection` | "Sewer Data" | `sewage_data` |

### 6.3 On Screen Resume
- Fetch the list of available languages from `/api/language/languages` and cache in state
- If user has `building-survey` permission: call `GET /api/wms/buildings` (warm-up)
- If user has `save-assessment` or `save-emptying-service`: call `GET /api/assessed-applications` (warm-up)

---

## Task 7 – Building Map Screen

### 7.1 Overview
A full-screen Google Map where the user can:
- See their current GPS location
- Draw a polygon footprint for a new building by tapping the map
- View existing WMS tile overlays (buildings, roads, wards)
- Tap on existing WMS buildings or locally-drafted buildings to edit them

### 7.2 Permissions Gate
If location permission is denied OR location services are disabled:
- Show an error message: "Error: Location Permission Denied"
- Request permissions via system dialog

### 7.3 Map Layers (WMS Tiles)
Fetch WMS tile URLs on screen load:
- `GET /api/wms/buildings` → `baseUrl + data.buildings` → building layer
- `GET /api/wms/roads` → road layer
- `GET /api/wms/wards` → ward layer

Each layer has a toggle (on/off). Layers dialog opened via a FAB (layers icon, bottom-left).

WMS tile URL template includes `{x}`, `{y}`, `{z}` placeholders for Google Maps tile rendering.

### 7.4 Modes: View vs Edit (Drawing)
**View mode (default):**
- Map tap → first check locally drafted building polygons (point-in-polygon test)
- If inside a local polygon → navigate to `building_edit` with `source="local", index=<n>`
- Else → query WMS `GetFeatureInfo` for the tapped coordinate:
  - Build a bounding box `±0.00025` around the tap point
  - Request `PROPERTYNAME: bin,owner_name,owner_contact,ward,tax_code`
  - If a feature with a non-empty `bin` is found → navigate to `building_edit` with `source="wms", bin=<bin>`

**Edit / Drawing mode** (toggled by a FAB with `+` / `×` icon, bottom-left):
- Each tap on the map adds a new marker (vertex) to the polygon
- Markers are draggable; drag end updates their position
- Pressing a marker shows Alert: "DELETE – Are you sure you want to remove marker number N?" → confirm removes the marker
- A `Polygon` overlay is drawn connecting all markers
- Edge midpoints show the distance between adjacent vertices in meters
- Exit drawing mode: if no unsaved changes → toggle off; else show "Discard changes?" confirmation

### 7.5 Save Drawing Flow
When ≥ 3 vertices are placed:
- A floating info button appears (bottom-right area)
- Press it → show a modal summarizing the polygon coords
- Press "Next" in the modal → save polygon to state and navigate to `create_building_after_draw`

### 7.6 Locally Drafted Buildings
- Buildings saved in the local Room DB are also rendered as `Polygon` overlays
- Selected building highlighted in red; others in blue
- Tapping them navigates to `building_edit`

---

## Task 8 – Create Building Form (After Draw)

This screen appears after a building polygon is drawn. The user fills in building metadata, then the draft is saved locally.

### 8.1 Form Fields
Load dropdown options from `GET /api/building-info/buildings/create-data` on screen open.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `temp_building_code` | TextInput | ✅ | Temporary building code |
| `tax_code` | TextInput | — | Auto-formatted: `XX-XXX-XXXX-XX` (digits only, max 11) |
| `collected_date` | DatePicker | ✅ | Default: today; YYYY-MM-DD |
| `ward` | Dropdown | ✅ | From API `ward` options |
| `road_code` | Dropdown | ✅ | From API `road_code` options |
| `house_number` | TextInput | — | |
| `structure_type_id` | Dropdown | ✅ | From API; values: CGI Sheet, Load Bearing, RCC Framed, Wooden/Mug |
| `construction_year` | DatePicker | — | YYYY-MM-DD, must not be in future |
| `floor_count` | TextInput (numeric) | ✅ | Must be ≥ 0.1 |
| `functional_use_id` | Dropdown | ✅ | From API; 15 categories (see enum) |
| `use_category_id` | Dropdown | Conditional | Required if functional_use_id is set; options filtered by functional use |
| `main_building` | Switch/Toggle | — | "Is main building?" Default on |
| `building_associated_to` | Dropdown | Conditional | Shown only if NOT main building; pick from existing BINs |
| `water_source_id` | Dropdown | ✅ | From API |
| `lic_status` | Toggle | — | "LIC status" |
| `lic_id` | Dropdown | Conditional | Shown if lic_status = true; from API LIC names |
| `watersupply_pipe_code` | Dropdown | Conditional | Shown if water source requires it |
| `toilet_status` | Toggle | ✅ | Does the building have a toilet? Default yes |
| `toilet_count` | TextInput (numeric) | Conditional | Shown only if toilet_status = true |
| `sanitation_system_id` | Dropdown | Conditional | Shown if toilet_status = true; from API |
| `defecation_place` | Dropdown | Conditional | Shown if toilet_status = false |
| `ctpt_name` | Dropdown | Conditional | Shown if sanitation_system uses CTPT |
| `build_contain` | Dropdown | Conditional | Pre-connected BIN; shown if sanitation connects to existing |
| `sewer_code` | Dropdown | Conditional | Shown if sewer-connected sanitation |
| `drain_code` | Dropdown | Conditional | Shown if drain-connected sanitation |
| `population_served` | TextInput (numeric) | ✅ | |
| `household_with_private_toilet` | TextInput (numeric) | — | |
| `population_with_private_toilet` | TextInput (numeric) | — | |
| `house_locality` | TextInput | — | |
| `house_image` | Image Picker | — | Camera or gallery; max 5 MB; JPEG/PNG |

### 8.2 Conditional Field Visibility Rules
```
building_associated_to  → visible when main_building == false
lic_id                  → visible when lic_status == true
watersupply_pipe_code   → visible when water_source requires pipe code
toilet_count            → visible when toilet_status == true
sanitation_system_id    → visible when toilet_status == true
defecation_place        → visible when toilet_status == false
ctpt_name               → visible when sanitation_system uses CTPT
build_contain           → visible when sanitation_system pre-connects to BIN
use_category_id         → visible when functional_use_id is set
```

### 8.3 Save Draft
On pressing "Save":
1. Run `validateBuildingDraft()` → check required fields
2. Generate a KML file from the polygon coords and form data; save to internal app storage
3. Store the draft (including KML file path and optional house_image) in the Room `building_drafts` table with `upload_status = "pending"`
4. Clear current polygon coords from the ViewModel
5. Navigate back to `building_data`

### 8.4 KML File Format
```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <ExtendedData>
      <!-- key/value pairs of all building form fields -->
    </ExtendedData>
    <Polygon>
      <outerBoundaryIs>
        <LinearRing>
          <coordinates><!-- lon,lat,0 pairs --></coordinates>
        </LinearRing>
      </outerBoundaryIs>
    </Polygon>
  </Placemark>
</kml>
```

---

## Task 9 – Building Edit Screen

Allows editing a building that already exists on the server (WMS source) or a locally saved draft.

### 9.1 Data Loading
- **Source = "wms" (server building):** Call `GET /api/building-info/buildings/{bin}/edit-data` → populate form fields from response
- **Source = "local" (draft):** Load from Room `building_drafts` by index/id → populate form fields

### 9.2 Form Fields
Same fields as Task 8 (Create Building Form), pre-populated with existing data. The same conditional visibility rules apply.

### 9.3 Save Changes
- **Source = "wms":** Call `POST /api/building-info/update/{bin}` with multipart form data (all fields + optional house_image)
- **Source = "local":** Update the Row in Room `building_drafts`

### 9.4 Generate / Attach KML
If coords are provided: generate KML and attach as `kml` file in multipart upload, same as Task 8.3.

---

## Task 10 – Building Data Screen

Lists all locally saved building drafts from Room DB.

### 10.1 UI
- `AppHeader` with title "Building Data"
- `RecyclerView` / LazyColumn of `BuildingDraftCard` items
- If empty → show error message: "No building data stored in this device"

### 10.2 `BuildingDraftCard`
Each card shows:
- "Temporary Building Code": `temp_building_code`
- "Tax Code": `tax_code`
- "Created date": `created_date`
- "Upload status": `upload_status` (pending / uploading / failed)
- "Last error" (if `last_error` is non-null)

Action buttons:
- **Delete**: Alert confirmation → delete from Room
- **Upload**: multipart POST to `/api/save-building` with form data + KML + house_image; on success → delete row from Room and delete local KML file; on failure → update `upload_status = "failed"` and store `last_error`
- **View on map**: navigate to `kml_viewer` with the draft item

### 10.3 Upload Logic
Build `multipart/form-data`:
- Include all building form fields (non-empty values only)
- Boolean fields (`toilet_status`, `main_building`, `lic_status`) normalized to `"0"` / `"1"`
- KML file attached as `kml` key
- House image attached as `house_image` key (if present)
- Use Bearer token from DataStore

---

## Task 11 – KML Viewer Screen

Shows a building's polygon on a read-only map for verification.

### 11.1 UI
- `AppHeader` with title "Building location"
- Full-screen Google Map
- Parse `coords_json` from the building draft
- Draw a `Polygon` overlay
- Center/animate camera to the polygon bounds
- No interaction (view only)

---

## Task 12 – Containment Map Screen

Marks a single containment point on a map.

### 12.1 UI
- Full-screen Google Map
- WMS overlays: containment layer, road layer, ward layer (each toggleable via FAB → layers dialog)
- Current GPS location marker
- A single draggable marker placed on map tap (replaces previous marker)
- FAB button (bottom area) to open "Info" modal confirming the coordinates

### 12.2 Data Flow
- On pressing the Info button → show a modal with lat/lng
- User can press "Next" → opens `SaveDataModal` where they enter containment form data
- On save → write to Room `containment_drafts` and navigate back

### 12.3 WMS Links
- `GET /api/wms/contaiments` → containment layer URL
- `GET /api/wms/roads` → road layer URL
- `GET /api/wms/wards` → ward layer URL

---

## Task 13 – Containment Data Screen

Lists locally saved containment drafts.

### 13.1 UI
- `AppHeader` with title "Containments Data"
- `RecyclerView` / LazyColumn of containment cards
- If empty → "No containment data stored"

### 13.2 `ContainmentDraftCard`
Each card shows:
- Coordinates / location
- Created date
- Upload status

Action buttons:
- **Delete**: Alert confirmation → delete from Room
- **Upload**: POST to `/api/save-containment` with form data (multipart); on success → remove from Room
- **View on map**: navigate to `containment_viewer`

---

## Task 14 – Application List Screen

Displays a list of applications for a given service type.

### 14.1 Modes
The screen is reused for three modes (passed via nav args):
- `emptying = true` → fetch from `GET /api/pending-applications`
- `assessment = true` → fetch from `GET /api/applications`
- `sludgeCollection = true` → fetch from `GET /api/sludge-collection-applications`

### 14.2 UI
- `AppHeader` with title "Application List"
- `RecyclerView` / LazyColumn of `ApplicationListCard` items
- Pull-to-refresh
- Loading spinner while fetching
- Empty state: "No suitable applications available for this service."

### 14.3 `ApplicationListCard`
Each card shows:
- Customer name
- Customer contact
- Application ID / status
- Action buttons:
  - 📞 **Call** → open `tel:<customer_contact>` intent
  - 📍 **Location** → open Google Maps intent with the building's coordinates (`geo:lat,lng(label)`)
  - ▶ **Start** → navigate to appropriate submission screen:
    - `emptying` → `empty_submission` with item
    - `assessment` → `containment_assessment` with item
    - `sludgeCollection` → `sludge_collection` with item

---

## Task 15 – Emptying Submission Screen

Form to record a completed emptying service for an application.

### 15.1 Data Loading (on screen open)
Parallel fetches:
- `GET /api/drivers` → dropdown options
- `GET /api/emptiers` → dropdown options
- `GET /api/treatment-plants` → dropdown options
- `GET /api/vacutugs` → dropdown options (desludging vehicles)
- Current GPS location → pre-fill `latitude`, `longitude`
- `GET /api/containments/{bin}` → containment options (loaded when building is selected)

### 15.2 Form Fields (from `EmptyingFieldsEnum`)
| Field | Type | Required |
|-------|------|----------|
| Date | DatePicker | ✅ |
| Service Receiver Name | TextInput | ✅ |
| Service Receiver Gender | Dropdown (Male/Female/Other) | ✅ |
| Service Receiver Contact | TextInput (phone) | ✅ |
| Reason For Emptying | TextInput | — |
| Sludge Volume (m³) | TextInput (numeric) | ✅ |
| Distance Closest to Well (m) | TextInput (numeric) | — |
| Desludging Vehicle Number Plate | Dropdown (from vacutugs API) | ✅ |
| Disposal Place | Dropdown | ✅ |
| Treatment Plant | Dropdown (from treatment-plants API) | ✅ |
| Driver | Dropdown (from drivers API) | ✅ |
| Emptier 1 | Dropdown (from emptiers API) | ✅ |
| Emptier 2 | Dropdown (from emptiers API) | — |
| Start Time | TimePicker | ✅ |
| End Time | TimePicker | ✅ |
| No. of Trips | TextInput (numeric) | ✅ |
| Receipt Number | TextInput | — |
| Total Cost | TextInput (numeric) | — |
| House Image | Image Picker (camera/gallery) | — |
| Receipt Image | Image Picker (camera/gallery) | — |
| Comments | TextInput (multi-line) | — |
| Building ID | Auto from picker / pre-filled | ✅ |
| Containment ID | Dropdown from containments | — |

### 15.3 Building Selection
- A "Select Building" button opens `emptying_building_picker`
- When the user returns with a selected building, pre-fill `building_id` and load containments for that building

### 15.4 Image Capture
Both house and receipt images support:
- Take photo with camera
- Choose from gallery
- Show thumbnail preview in the form

### 15.5 Submit
POST to `/api/save-emptying` as `multipart/form-data`:
- All form fields
- `house_image` file (if provided)
- `receipt_image` file (if provided)
- `latitude` / `longitude` (current GPS)

On success → navigate back to Application List and refresh.

---

## Task 16 – Emptying Building Picker Screen

A map-based screen for selecting a building to associate with an emptying service.

### 16.1 UI
- Full-screen Google Map with WMS building overlay
- `AppHeader` with title "Select Building"

### 16.2 Tap to Select
- On map tap → call WMS `GetFeatureInfo` for the tapped coordinate (same logic as Task 7.4)
- If features found → show an Alert listing all matching features' properties (BIN, owner name, ward, tax code)
- User selects one → return the `bin` back to the previous screen via shared ViewModel or nav result

---

## Task 17 – Containment Assessment Screen

Form to assess a containment before an emptying service.

### 17.1 Data Loading
- `GET /api/service-providers` → service provider dropdown
- `GET /api/vacutugs` → vacutug type dropdown

### 17.2 Form Fields
| Field | Type | Notes |
|-------|------|-------|
| Application ID | ReadOnly | From nav args |
| Assessment Date | DatePicker | Default: today |
| Proposed Emptying Date | DatePicker | |
| Customer Name | TextInput | |
| Customer Gender | Dropdown (Male/Female/Other) | |
| Vacutug Accessible | Checkbox (yes/no) | |
| Road Distance (m) | TextInput (numeric) | |
| Road Width (m) | TextInput (numeric) | |
| Sludge (ASD) | TextInput | |
| Containment Type | ReadOnly | From item (septic tank / pit) |
| Tank Length / Width / Depth | TextInput (numeric) | Shown for septic-tank type |
| Pit Number / Diameter / Depth | TextInput (numeric) | Shown for pit type |
| Vacutug Type | Dropdown | |
| Required Trips | TextInput (numeric) | |
| Estimated Cost | TextInput (numeric) | |
| Comments | TextInput (multi-line) | |
| Receipt / House Image | Image Picker | Camera or gallery |

### 17.3 Validation
Use Yup-equivalent Android validation:
- `proposed_emptying_date` required
- `rddist` and `rdwidth` required (numeric)
- `sludgeasd` required (numeric)
- Required containment dimension fields based on `containment_type`

### 17.4 Submit
POST to `/api/save-assessment` as `multipart/form-data`.
On success → navigate back and show success message.

---

## Task 18 – Sludge Collection Screen

Records sludge collected at a treatment plant for an existing application.

### 18.1 UI Fields
| Field | Type | Notes |
|-------|------|-------|
| Treatment Plant Name | ReadOnly TextInput | From `item.treatment_plant_name` |
| Application ID | ReadOnly TextInput | From `item.id` |
| Sludge Volume (m³) | ReadOnly TextInput | From `item.volume_of_sludge` |
| Date | DatePicker (required) | Format: `MM/DD/YYYY` |
| No. of Trips | TextInput numeric (required) | Must be > 0 |
| Entry Time | TimePicker (required) | |
| Exit Time | TimePicker (required) | Must be after entry time |

### 18.2 Validation
- Date required
- No. of Trips required and > 0
- Entry Time required
- Exit Time required and must be later than Entry Time

### 18.3 Submit
POST to `/api/save-sludge-collection`:
```json
{
  "application_id": 123,
  "date": "YYYY-MM-DD",
  "no_of_trips": 3,
  "entry_time": "HH:mm",
  "exit_time": "HH:mm"
}
```
On success → show "Sludge collection details saved successfully" → navigate back.

---

## Task 19 – Sewer Map Screen

Marks sewer connection points and collects BIN + sewer code data.

### 19.1 UI
- Full-screen Google Map
- WMS overlays: sewer layer, building layer, road layer, ward layer (each toggleable)
- Current GPS location marker
- Multiple draggable markers (similar to Building Map drawing mode)

### 19.2 WMS Links
- `GET /api/wms/buildings`
- `GET /api/wms/roads`
- `GET /api/wms/wards`
- `GET /api/wms/sewers`

### 19.3 Data Collection Modal
- FAB button opens an info modal
- Modal asks user to enter:
  - **Building ID (BIN)** – selected from `GET /api/buildingcode` list or typed
  - **Sewer Code** – selected from `GET /api/sewercode` list or typed
- "Save" → writes to Room `sewer_drafts` and clears current markers

---

## Task 20 – Sewer Data Screen

Lists locally saved sewer connection records.

### 20.1 UI
- `AppHeader` with title "Sewer Data"
- `RecyclerView` / LazyColumn of sewer cards
- If empty → "You have not added any sewer data into this device"

### 20.2 `SewerDraftCard`
Each card shows:
- Building Identification Number (BIN)
- Sewer Code
- Created date

Action buttons:
- **Delete**: Alert confirmation → remove from Room
- **Upload**: POST to `/api/save-sewerconnection` with `{ bin, sewer_code }` as multipart; on success → remove from Room

---

## Task 21 – Containment Viewer Screen

Read-only map showing the location of a saved containment point.

### 21.1 UI
- Full-screen Google Map
- Show a single marker at the containment coordinates
- Camera animates to the marker
- No editing

---

## Task 22 – Applicant Map Viewer Screen

Shows the location of an applicant/customer on a map.

### 22.1 UI
- Full-screen Google Map
- Parse the applicant's coordinates from the geometry field passed via nav args
- Show a single marker at the location
- Camera animates to the location
- Optionally show applicant name label

---

## Task 23 – Building Survey Screen (Legacy Form)

A simplified survey form (appears to be partially superceded by the Create Building flow but is still in the nav graph).

### 23.1 Form Fields
| Field | Type |
|-------|------|
| Is main building? | Dropdown (Yes/No) |
| Building number | TextInput (conditional: shown if NOT main building) |
| Tax code | TextInput |
| Select ward no | Dropdown |
| Street name | TextInput |
| Select structure type | Dropdown (CGI Sheet, Load Bearing, RCC Framed, Wooden/Mug) |
| Number of floors | TextInput (numeric) |
| Functional use of building | Dropdown |
| Use of building category | Dropdown |
| Office or business name | TextInput (conditional: non-residential) |
| Number of households | TextInput (numeric) |
| Total population | TextInput (numeric) |
| Surveyed date | DatePicker |
| Sanitation System Technology | Dropdown (15 options) |
| Conditional containment fields (length/width/depth/volume) | TextInputs |
| Vacutug accessible | Dropdown |
| Total number of toilets | TextInput |
| Main drinking water source | Dropdown |
| Well presence | Dropdown |
| Distance of containment from well (m) | TextInput (numeric) |
| Water supply Customer ID | TextInput |
| SWM Customer ID | TextInput |
| Owner name | TextInput |
| Gender | Dropdown (Male/Female/Other) |
| Contact number | TextInput (phone) |

### 23.2 Submit
- "Save" button (60% width, contained style)
- Submit form data to the appropriate endpoint (same as building creation)

---

## Task 24 – Land Service Screens

These screens are present in the codebase but appear lightly implemented. Build the following stubs that can be fleshed out later.

### 24.1 Land Applicant List Screen
- `AppHeader` with title "Land"
- List of land applicants (fetch from API when available)
- Each item navigates to `land_detail`

### 24.2 Land Owner Detail Screen
- `AppHeader` with title "Detail"
- Shows owner name, contact, land details
- Empty state if no data available

---

## Task 25 – About Us Screen

Simple info screen.

### 25.1 UI
- `AppHeader` with title "About us"
- Body: app description, municipality name, contact info, license info
- Link to developer website: `https://www.innovativesolution.com.np`
- CC license link: `https://creativecommons.org/licenses/by-nc-sa/4.0/`

---

## Task 26 – Shared UI Components

### 26.1 `AppHeader`
Props: `title: String`, `showBackButton: Boolean`, `actions: List<Action>`
- Background: primary color
- White title and icons
- Leading back arrow (if `showBackButton = true`) with `popBackStack()`

### 26.2 `LoadingSpinner` / `LoadingOverlay`
- Full-screen semi-transparent overlay
- Centered circular progress + optional title text
- Used for long-running operations (uploading, logging out)

### 26.3 `PrimarySpinner`
- Full-screen centered `CircularProgressIndicator`
- Used for list data loading (no overlay)

### 26.4 `ErrorMessage`
Props: `message: String`
- Centered icon + text in the middle of the screen
- Used for empty states and permission errors

### 26.5 `DashboardTile`
Props: `title: String`, `imageRes: Int`, `onClick: () -> Unit`
- Fixed-size card (~160 dp × 160 dp)
- Image centered above title text
- Ripple on tap

### 26.6 `ApplicationListCard`
Props: application item data, `onCall`, `onLocation`, `onStart` callbacks
- Shows customer name, contact, building info
- Three action buttons: Call, Location, Start

### 26.7 `Profile`
- Shows logged-in user's name, role, and municipality name from auth state

### 26.8 `WmsView` / `LayersDialog`
A dialog listing WMS layer toggles:
- Building layer (on/off)
- Road layer (on/off)
- Ward layer (on/off)
- (Sewer layer for sewage screens)

### 26.9 `SelectionInput`
A text field that opens a bottom sheet with a searchable list of options when tapped.

### 26.10 `MapInfoModal`
A bottom sheet or dialog that displays map/polygon summary info and a "Next" action button.

### 26.11 `SaveSewageModal` / `SaveDataModal`
Bottom sheet forms for entering BIN + sewer code (sewer) or containment metadata (containment).

---

## Task 27 – Permissions Handling

### 27.1 Location Permissions
- Request `ACCESS_FINE_LOCATION` at runtime on first map screen open
- If denied → show rationale dialog → re-request
- If permanently denied → show settings intent

### 27.2 Location Services (GPS)
- Check if location services are enabled using `LocationManager`
- If disabled → show system dialog to enable location (Android `ACTION_LOCATION_SOURCE_SETTINGS`)
- Expose both `permissionGranted: Boolean` and `locationEnabled: Boolean` via a shared `PermissionsViewModel`

### 27.3 Storage Permissions
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` required for Android ≤ 12 (Platform API < 33)
- Android 13+ → `READ_MEDIA_IMAGES` for image picker

### 27.4 Camera Permission
- Required before launching camera intent
- Request at runtime before opening camera

---

## Task 28 – Language / i18n Support

### 28.1 Fetching Languages
On Home screen load:
- `GET /api/language/languages` → list of `{ code, name }` objects
- Cache in DataStore as `languages`

### 28.2 Fetching Translations
When a language is selected (or on login):
- `GET /api/language/translations/{lang_code}` → map of `{ "key": "translated_string" }`
- Cache in DataStore as `contentsLabel`

### 28.3 Using Labels
Every user-visible string must be looked up through a helper function:
```kotlin
fun getLabel(key: String): String = contentsLabel[key] ?: key
```
This means all UI text is dynamic. Fall back to the key itself if no translation is found.

### 28.4 Language Switcher
- Accessible from the Home screen header (or settings area)
- Shows a list of available languages
- On selection → fetch translations and update `contentsLabel` in DataStore

---

## Task 29 – Theme & Styling

### 29.1 Color Palette
| Token | Value |
|-------|-------|
| `primary` | `#1E4D78` |
| `onPrimary` | `#FFFFFF` |
| `primaryContainer` | `#D4E3FF` |
| `secondary` | `#54 5F71` |
| `error` | `#BA1A1A` |
| `background` | `#FDFCFF` |
| `surface` | `#FDFCFF` |
| `success` | `#22BB33` |

Use Material Design 3 `ColorScheme`. Support both light and dark themes (full dark/light token sets provided in `colors.js`).

### 29.2 Typography
- Use Material Design 3 `Typography`
- Headers: medium weight
- Body text: regular
- Captions / labels: small

### 29.3 Spacing
| Token | Value |
|-------|-------|
| `xxs` | 4 dp |
| `xs` | 8 dp |
| `sm` | 12 dp |
| `md` | 16 dp |
| `lg` | 24 dp |
| `xl` | 32 dp |

### 29.4 Elevation / Rounding
- Cards: 1 dp elevation, 2 dp corner radius
- FABs: standard Material FAB
- Dialogs: Material AlertDialog / BottomSheetDialog

---

## Data Models Reference

### Building Draft
```kotlin
data class BuildingDraft(
    val id: Int = 0,
    val featureId: String? = null,
    val tempBuildingCode: String = "",
    val taxCode: String = "",
    val collectedDate: String = "",
    val ward: String = "",
    val roadCode: String = "",
    val houseNumber: String = "",
    val structureTypeId: String = "",
    val constructionYear: String = "",
    val floorCount: String = "",
    val functionalUseId: String = "",
    val useCategoryId: String = "",
    val waterSourceId: String = "",
    val sanitationSystemId: String = "",
    val sewerCode: String = "",
    val drainCode: String = "",
    val toiletStatus: String = "1",
    val toiletCount: String = "",
    val defecationPlace: String = "",
    val ctptName: String = "",
    val buildContain: String = "",
    val buildingAssociatedTo: String = "",
    val watersupplyPipeCode: String = "",
    val licId: String = "",
    val mainBuilding: String = "1",
    val licStatus: String = "0",
    val populationServed: String = "",
    val houseLocality: String = "",
    val householdWithPrivateToilet: String = "",
    val populationWithPrivateToilet: String = "",
    val coordsJson: String = "",         // JSON array of LatLng
    val path: String? = null,            // Local KML file path
    val kmlFileName: String? = null,
    val houseImageUri: String? = null,
    val houseImageType: String? = null,
    val houseImageName: String? = null,
    val uploadStatus: String = "pending",
    val lastError: String? = null,
    val fieldErrorsJson: String? = null,
    val createdDate: String = "",
    val updatedAt: String = ""
)
```

### Permissions Map
```kotlin
data class Permissions(
    val buildingSurvey: Boolean = false,       // "building-survey"
    val saveAssessment: Boolean = false,        // "save-assessment"
    val saveEmptyingService: Boolean = false,   // "save-emptying-service"
    val sludgeCollection: Boolean = false,      // "sludge-collection"
    val sewerConnection: Boolean = false        // "sewer-connection"
)
```

### Application Item (from API)
```kotlin
data class ApplicationItem(
    val id: Int,
    val customerName: String,
    val customerContact: String,
    val containmentType: String?,
    val geometry: Geometry?,
    val treatmentPlantName: String?,
    val volumeOfSludge: Double?,
    // ... other fields
)
```

---

## API Endpoints Reference

All endpoints are relative to `{BASE_URL}/api/`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `login` | Authenticate user |
| POST | `logout` | Invalidate token |
| GET | `wms/buildings` | WMS URL for buildings layer |
| GET | `wms/contaiments` | WMS URL for containments layer |
| GET | `wms/roads` | WMS URL for roads layer |
| GET | `wms/wards` | WMS URL for wards layer |
| GET | `wms/sewers` | WMS URL for sewers layer |
| GET | `building-info/buildings/create-data` | Dropdown options for building form |
| GET | `building-info/buildings/{bin}/edit-data` | Existing building data for editing |
| POST | `building-info/update/{bin}` | Update existing building (multipart) |
| POST | `save-building` | Upload a new building draft (multipart) |
| POST | `save-containment` | Upload containment data |
| GET | `buildingcode` | List of building BINs |
| GET | `sewercode` | List of sewer codes |
| POST | `save-sewerconnection` | Upload sewer connection data |
| GET | `assessed-applications` | Applications ready for emptying |
| GET | `pending-applications` | Pending emptying applications |
| GET | `sludge-collection-applications` | Sludge collection applications |
| GET | `applications` | Applications for assessment |
| GET | `drivers` | List of drivers |
| GET | `emptiers` | List of emptiers |
| GET | `service-providers` | List of service providers |
| GET | `treatment-plants` | List of treatment plants |
| GET | `vacutugs` | List of desludging vehicles |
| GET | `containments/{bin}` | Containments for a specific building |
| POST | `save-emptying` | Submit emptying service record (multipart) |
| POST | `save-assessment` | Submit containment assessment (multipart) |
| POST | `save-sludge-collection` | Submit sludge collection record |
| GET | `language/languages` | Available language list |
| GET | `language/translations/{lang}` | UI label translations for a language |
| POST | `building-info/buildings/{bin}` | Create building info record (multipart) |

### WMS `GetFeatureInfo` Request Parameters
Used for tapping on a WMS map layer to get feature data:
```
SERVICE=WMS
REQUEST=GetFeatureInfo
PROPERTYNAME=bin,owner_name,owner_contact,ward,tax_code
VERSION=1.1.1 (or from URL)
INFO_FORMAT=application/json
FEATURE_COUNT=5
FORMAT=image/png
TRANSPARENT=true
LAYERS={layer}
QUERY_LAYERS={layer}
STYLES=
WIDTH=101, HEIGHT=101
BBOX={lat-pad},{lng-pad},{lat+pad},{lng+pad}   (pad = 0.00025)
SRS=EPSG:4326
CRS=EPSG:4326
X=50, Y=50, I=50, J=50
```

---

*End of Requirements Document*
