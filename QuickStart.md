# QuickStart

## Project Snapshot

This is a **React Native** mobile application (JavaScript + some TypeScript) with:

- React Native `0.74.x`
- Redux Toolkit + Redux Persist for global state
- React Navigation (native stack) for routing
- Axios service layer for API communication
- Android flavor-based environment configuration (`dev` / `prod`)

Primary domain modules include building survey, emptying service, containment/sewer data, and map-driven workflows.

## Tech Stack

- Runtime: React Native, React 18
- Language: JavaScript-first with TypeScript-enabled config
- State: Redux Toolkit, React Redux, redux-persist
- Navigation: `@react-navigation/native`, `@react-navigation/native-stack`
- UI: `react-native-paper`, custom components
- Networking: Axios + centralized interceptors
- Env config: `react-native-config`

## Important Files and What They Do

### App Bootstrap

- `index.js`: React Native entrypoint (`AppRegistry.registerComponent`)
- `App.js`: Global providers and app shell initialization
  - Redux `Provider`
  - `PersistGate`
  - Paper theme provider
  - Action sheet provider
  - Bootsplash hide logic

### Routing and Navigation

- `src/navigation/index.js`: Auth gate (signin vs root stack)
- `src/navigation/RootStack.js`: Main stack screen registration
- `src/core/constants/routes.js`: Route name constants used across app
- `src/utils/navigation.js`: Navigation ref helper for imperative navigation

### Config and Environments

- `src/constants/config.ts`: Reads runtime env (`APP_CONFIG`, `BASE_URL`)
- `android/app/build.gradle`: Maps Android build variants to env files
  - `devDebug/devRelease -> .env.dev`
  - `prodDebug/prodRelease -> .env.prod`
- `example.env.dev`, `example.env.prod`: Environment templates

### State Management

- `src/store/index.js`: Redux store setup
- `src/store/rootReducer.js`: Combined reducers + persist config
- `src/store/slices/auth.slice.js`: Auth/user/permissions state
- `src/store/slices/map.slice.js`: Map-related state

### API Layer

- `src/axios/index.js`: Shared Axios client + interceptors + auth header
- `src/core/constants/urls.js`: API endpoint constants
- `src/service/*.js`: Feature-specific API wrappers
  - `auth_service.js`
  - `supervisor_service.js`
  - `building_service.js`

### Feature Areas

- `src/screens/auth/*`: Login/auth screens
- `src/screens/root/*`: Main app screens
- `src/components/*`: Reusable UI components by domain
- `src/hooks/PermissionContext.tsx`: Location/permission flow for Android/iOS

## High-Level Flow

1. App starts in `index.js` and renders `App.js`.
2. `App.js` initializes providers and loads persisted Redux state.
3. `src/navigation/index.js` decides route tree:
   - If token + permissions exist: load `RootStack`
   - Else: load sign-in screen
4. On login success, auth state is stored in Redux/AsyncStorage.
5. Screens call services (`src/service/*`) that use shared Axios client.
6. Base API URL comes from env files via `src/constants/config.ts`.

## Build and Run

## Prerequisites

- Node.js >= 18
- Yarn (project uses Yarn 3)
- Android Studio + SDK (for Android)
- Xcode + CocoaPods (for iOS on macOS)

## Install

```bash
yarn install
```

For iOS (macOS only):

```bash
cd ios
pod install
cd ..
```

## Environment Setup

Copy example env files and set real API host values:

```bash
cp example.env.dev .env.dev
cp example.env.prod .env.prod
```

Set at least:

```env
APP_CONFIG=development   # or production
BASE_URL=http://your-api-host
```

## Start Metro

```bash
yarn start
```

If needed:

```bash
yarn start --reset-cache
```

## Run Android

```bash
yarn android:dev
# or
yarn android:dev-release

yarn android:prod
# or
yarn android:prod-release
```

## Run iOS

```bash
yarn ios
```

## Quality and Tests

```bash
yarn lint
yarn test
```

## Contribution Guidelines (Project-Tailored)

No explicit `CONTRIBUTING.md` was found, so follow these conventions from the current codebase:

1. Use route constants, not hardcoded screen names.
   - Add/update route IDs in `src/core/constants/routes.js`
   - Register screens in `src/navigation/RootStack.js`
2. Add API integrations through the service layer.
   - Add endpoint key in `src/core/constants/urls.js`
   - Add wrapper function in `src/service/<feature>_service.js`
   - Consume wrappers from screens/hooks/components
3. Keep auth-sensitive logic centralized.
   - Token/permissions in `auth.slice.js`
   - Rely on `src/navigation/index.js` auth gate for stack switching
4. Keep feature code grouped by domain.
   - Screens in `src/screens/root/*`
   - Reusable UI in `src/components/<feature>/*`
5. Preserve existing style.
   - Existing code style is mostly JS with semicolon usage mixed by file
   - Run lint before opening PR

## Recommended PR Checklist

- [ ] Builds and runs in at least one target platform
- [ ] `yarn lint` passes
- [ ] `yarn test` passes (if tests affected)
- [ ] New route names added to constants and stack registration
- [ ] API additions wired through `urls.js` + service layer
- [ ] Env/config changes documented

## Common First Tasks for New Contributors

- Add a new root screen:
  1. Create screen under `src/screens/root`
  2. Add route constant in `src/core/constants/routes.js`
  3. Register in `src/navigation/RootStack.js`
  4. Add navigation trigger from Home or relevant module

- Add a new backend endpoint:
  1. Add endpoint path in `src/core/constants/urls.js`
  2. Add service function in `src/service/*`
  3. Call service from screen/hook and handle loading/error states

- Change API host per environment:
  1. Edit `.env.dev` / `.env.prod`
  2. Rebuild app variant (`android:dev` / `android:prod`)

## Notes and Pitfalls

- If login succeeds but app does not switch stacks, verify `token` and `permissions` are both set in auth state.
- If API calls fail unexpectedly, confirm `BASE_URL` and flavor/env mapping in Android Gradle.
- Some files use direct URL composition (`${BASE_URL_ENV}/api/...`) while others use Axios base URL; keep behavior consistent when adding new calls.

## Code Flow Diagram

```mermaid
flowchart TD
  subgraph Native_Startup
    A1[Android/iOS native runtime]
    A2[index.js]
    A3[App.js]
  end

  subgraph Global_Providers
    B1[Redux Store Provider]
    B2[PersistGate redux-persist]
    B3[Paper Theme Provider]
    B4[SheetProvider]
    B5[BootSplash hide]
  end

  subgraph Navigation
    C1[src/navigation/index.js]
    C2{auth.token && auth.permissions ?}
    C3[src/screens/auth/SigninScreen.js]
    C4[src/navigation/RootStack.js]
    C5[src/core/constants/routes.js]
  end

  subgraph Home_and_Route_Entry
    D1[src/screens/root/HomeScreen.js]
    D2[src/screens/root/ApplicationListScreen.js]
    D3[src/screens/root/EmptyingSubmissionScreen.js]
    D4[src/screens/root/ContainmentAssessmentScreen.js]
    D5[src/screens/root/BuildingDataScreen.js]
    D6[src/screens/root/ContainmentDataScreen.js]
    D7[src/screens/root/SewageDataScreen.js]
  end

  subgraph State
    E1[src/store/index.js]
    E2[src/store/rootReducer.js]
    E3[src/store/slices/auth.slice.js]
    E4[src/store/slices/map.slice.js]
  end

  subgraph Services_and_API
    F1[src/service/auth_service.js]
    F2[src/service/supervisor_service.js]
    F3[src/service/building_service.js]
    F4[src/axios/index.js]
    F5[src/core/constants/urls.js]
    F6[src/constants/config.ts]
  end

  subgraph Environment
    G1[example.env.dev / .env.dev]
    G2[example.env.prod / .env.prod]
    G3[android/app/build.gradle flavor mapping]
  end

  subgraph Device_Permissions
    H1[src/hooks/PermissionContext.tsx]
    H2[src/hooks/useEmptying.js]
  end

  A1 --> A2 --> A3
  A3 --> B1 --> B2 --> B3 --> B4 --> B5
  A3 --> C1
  C1 --> C2
  C2 -- No --> C3
  C2 -- Yes --> C4
  C4 --> C5
  C4 --> D1

  C3 --> F1 --> F4
  F1 --> E3
  E3 --> C2

  D1 --> D2
  D2 --> D3
  D2 --> D4
  D1 --> D5
  D1 --> D6
  D1 --> D7

  D3 --> H2 --> F2
  D4 --> F2
  D5 --> F3
  D6 --> F3
  D7 --> F5

  F2 --> F4
  F3 --> F4
  F4 --> F5
  F4 --> F6

  F6 --> G1
  F6 --> G2
  G3 --> G1
  G3 --> G2

  C1 --> H1
  D5 --> E4
  D6 --> E4
  D7 --> E4
  E1 --> E2 --> E3
  E1 --> E2 --> E4
```

## Critical Paths

1. Auth gate path:
   `App.js` -> `src/navigation/index.js` -> `src/screens/auth/SigninScreen.js` -> `src/service/auth_service.js` -> `src/axios/index.js` -> `src/store/slices/auth.slice.js` -> back to navigation gate.

2. Emptying workflow path:
   `src/screens/root/HomeScreen.js` -> `src/screens/root/ApplicationListScreen.js` -> `src/screens/root/EmptyingSubmissionScreen.js` -> `src/hooks/useEmptying.js` -> multipart POST to save-emptying endpoint (via URL/config constants).

3. Offline collection to upload path:
   map/field data staged in `src/store/slices/map.slice.js`, then uploaded from:
   `BuildingDataScreen`, `ContainmentDataScreen`, `SewageDataScreen`.

4. Config dependency path:
   `android/app/build.gradle` flavor selects env file -> `src/constants/config.ts` reads BASE_URL/APP_CONFIG -> `src/axios/index.js` and direct fetch-based upload screens consume API base URL.

