const { withGradleProperties } = require("@expo/config-plugins");

/**
 * Prebuild-safe gradle tuning.
 * Runs during `expo prebuild` and patches android/gradle.properties
 * so tweaks survive `--clean` (unlike manual edits to android/).
 *
 * Keep values conservative so EAS cloud (8 GB RAM) doesn't OOM.
 * ponytail: simple key-value patch, no extra deps.
 */
module.exports = (config) => {
  return withGradleProperties(config, (mod) => {
    const props = mod.modResults;
    const upsert = (key, value) => {
      const existing = props.find((p) => p.key === key);
      if (existing) existing.value = value;
      else props.push({ type: "property", key, value });
    };
    // Heap: 4g is safe for 32GB local and 8GB EAS; bump locally via ORG_GRADLE_JVMARGS env if needed
    upsert("org.gradle.jvmargs", "-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8");
    upsert("org.gradle.caching", "true");
    upsert("org.gradle.parallel", "true");
    upsert("org.gradle.configureondemand", "true");
    upsert("android.nonTransitiveRResources", "true");
    // kotlin incremental already default, but ensure
    upsert("kotlin.incremental", "true");
    // Keep 4 ABIs for prod; local quick builds override via -PreactNativeArchitectures flag
    return mod;
  });
};
