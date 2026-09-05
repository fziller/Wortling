# Sentry Launch Readiness

## Kurzurteil

Runtime error reporting is wired correctly enough for launch, but production source-map upload is not safe yet because EAS production has no Sentry environment variables configured.

## What Is Already Good

- `@sentry/react-native` is installed.
- `initSentry()` runs at app startup before rendering.
- Missing DSN disables Sentry instead of crashing the app.
- Sentry init is wrapped in `try/catch`, so monitoring failures do not block gameplay.
- `Sentry.wrap()` wraps the Expo root component and captures React render errors.
- The Expo config includes the `@sentry/react-native/expo` plugin.
- Local dotenv config loads `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`.

## Current Gap

`eas env:list --environment production` currently returns no variables. Cloud production builds therefore cannot upload source maps unless those values are configured elsewhere outside EAS env.

Required production env vars:

- `EXPO_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

Optional:

- `SENTRY_URL` if not using `https://sentry.io/`

## Before Release

1. Add the Sentry vars to EAS production environment.
2. Build once with `eas build --platform all --profile production`.
3. Confirm the build log contains Sentry source-map upload output.
4. Trigger a test error in a preview/prod build and confirm the event resolves to readable source files, not minified JS.
5. Run `eas update --channel production` only after confirming whether the Sentry Expo plugin uploads update source maps for this SDK/tooling combo. If not, export and run `yarn sentry:upload` against the generated `dist` bundle.

## Not Worth Adding Yet

- User context: there are no accounts, so there is no useful stable user ID to attach.
- Custom crash UI: nice later, not a launch blocker.
- More tracing: `tracesSampleRate` is already set to `0.2` in production; increase only if performance debugging actually needs it.
