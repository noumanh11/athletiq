#!/usr/bin/env bash
#
# Athletiq Android build, run inside the athletiq-android-builder container.
#
#   /src        project sources (read-only bind mount)
#   /workspace  persistent volume: synced sources, Linux node_modules, generated android/ project
#   /output     artifacts and logs for this run (bind mount to dist/android/<run>)
#
# Work is skipped when its inputs are unchanged: npm ci runs only when package-lock.json
# changes, expo prebuild only when app config or dependencies change, and Gradle, npm and
# ccache keep their caches in named volumes between runs.

set -Eeuo pipefail

FORMAT="${FORMAT:-apk}"                 # apk | aab
ABIS="${ABIS:-arm64-v8a,x86_64}"
CLEAN="${CLEAN:-0}"                     # 1 = regenerate android/ and drop native build outputs
MAX_WORKERS="${MAX_WORKERS:-0}"         # 0 = auto (CPU count, capped at 6 to limit memory use)
ARTIFACT_NAME="${ARTIFACT_NAME:-app-release}"

SRC=/src
WS=/workspace
OUT=/output
TOTAL_STEPS=6

if [ -t 1 ]; then
  C_STEP=$'\e[1;36m'; C_OK=$'\e[1;32m'; C_ERR=$'\e[1;31m'; C_DIM=$'\e[2m'; C_OFF=$'\e[0m'
else
  C_STEP=''; C_OK=''; C_ERR=''; C_DIM=''; C_OFF=''
fi

# Everything below goes to the console and (without colour codes) to /output/build.log.
mkdir -p "$OUT"
exec > >(tee >(sed -u 's/\x1b\[[0-9;]*m//g' >> "$OUT/build.log")) 2>&1
TEE_PID=$!

BUILD_START=$(date +%s)
STEP=0
STEP_NAME="startup"
STEP_START=$BUILD_START

step() {
  STEP=$((STEP + 1))
  STEP_NAME="$1"
  STEP_START=$(date +%s)
  printf '\n%s[%d/%d] %s%s\n' "$C_STEP" "$STEP" "$TOTAL_STEPS" "$STEP_NAME" "$C_OFF"
}

step_done() {
  printf '%s      %s finished in %ss%s\n' "$C_DIM" "$STEP_NAME" "$(( $(date +%s) - STEP_START ))" "$C_OFF"
}

on_error() {
  local code=$?
  printf '\n%sBuild failed during "%s" (step %d/%d) after %ss, exit code %d.%s\n' \
    "$C_ERR" "$STEP_NAME" "$STEP" "$TOTAL_STEPS" "$(( $(date +%s) - BUILD_START ))" "$code" "$C_OFF"
  printf 'Full log: build.log in the run folder.\n'
  exit "$code"
}
trap on_error ERR
trap 'exec 1>&- 2>&-; wait "$TEE_PID" 2>/dev/null || true; sleep 0.2' EXIT

case "$FORMAT" in
  apk) GRADLE_TASK=assembleRelease; ARTIFACT_SRC=android/app/build/outputs/apk/release/app-release.apk ;;
  aab) GRADLE_TASK=bundleRelease;   ARTIFACT_SRC=android/app/build/outputs/bundle/release/app-release.aab ;;
  *) echo "Unknown FORMAT '$FORMAT' (use apk or aab)"; exit 2 ;;
esac

if [ "$MAX_WORKERS" -le 0 ]; then
  MAX_WORKERS=$(nproc)
  if [ "$MAX_WORKERS" -gt 6 ]; then MAX_WORKERS=6; fi
fi

printf '%sAthletiq Android build%s  format=%s  abis=%s  clean=%s  workers=%s\n' \
  "$C_OK" "$C_OFF" "$FORMAT" "$ABIS" "$CLEAN" "$MAX_WORKERS"

# ---------------------------------------------------------------------------
step "Toolchain"
java -version 2>&1 | head -n 1
echo "node $(node --version), npm $(npm --version)"
echo "Android SDK: platforms $(ls "$ANDROID_HOME/platforms" | tr '\n' ' ')| build-tools $(ls "$ANDROID_HOME/build-tools" | tr '\n' ' ')| ndk $(ls "$ANDROID_HOME/ndk" | tr '\n' ' ')"
awk '/MemTotal/ { printf "CPUs: %s, memory: %.1f GB\n", cpus, $2 / 1048576 }' cpus="$(nproc)" /proc/meminfo
step_done

# ---------------------------------------------------------------------------
step "Sync sources"
rsync -a --delete \
  --exclude '/node_modules' --exclude '/android' --exclude '/ios' --exclude '/.expo' \
  --exclude '/dist' --exclude '/.git' --exclude '/.idea' --exclude '/.vscode' --exclude '/.claude' \
  --exclude '/graphify-out' --exclude '*.log' \
  "$SRC/" "$WS/"
cd "$WS"
echo "$(find . -path ./node_modules -prune -o -path ./android -prune -o -type f -print | wc -l) source files in /workspace"
step_done

# ---------------------------------------------------------------------------
step "Dependencies (npm ci)"
LOCK_HASH=$(sha256sum package-lock.json | cut -d ' ' -f 1)
if [ "$CLEAN" != "1" ] && [ -f node_modules/.athletiq-lock-hash ] && [ "$(cat node_modules/.athletiq-lock-hash)" = "$LOCK_HASH" ]; then
  echo "package-lock.json unchanged, reusing node_modules"
else
  npm ci --no-audit --no-fund --loglevel=error
  echo "$LOCK_HASH" > node_modules/.athletiq-lock-hash
fi
step_done

# ---------------------------------------------------------------------------
step "Native project (expo prebuild)"
PREBUILD_HASH=$(cat app.json package.json package-lock.json | sha256sum | cut -d ' ' -f 1)
if [ "$CLEAN" != "1" ] && [ -f android/.athletiq-prebuild-hash ] && [ "$(cat android/.athletiq-prebuild-hash)" = "$PREBUILD_HASH" ]; then
  echo "App config and dependencies unchanged, reusing android/ (incremental Gradle build)"
else
  if [ "$CLEAN" = "1" ]; then
    echo "Clean build: removing native build outputs of libraries"
    find node_modules -maxdepth 4 -type d \( -path '*/android/build' -o -path '*/android/.cxx' \) -prune -exec rm -rf {} +
  fi
  npx expo prebuild --platform android --clean --no-install
  echo "$PREBUILD_HASH" > android/.athletiq-prebuild-hash
fi
step_done

# ---------------------------------------------------------------------------
step "Gradle $GRADLE_TASK"
ccache --zero-stats > /dev/null
(
  cd android
  NODE_ENV=production ./gradlew "$GRADLE_TASK" \
    -PreactNativeArchitectures="$ABIS" \
    -Pkotlin.compiler.execution.strategy=in-process \
    -Dorg.gradle.jvmargs="-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8" \
    -Porg.gradle.java.installations.auto-download=false \
    --max-workers="$MAX_WORKERS" \
    --build-cache \
    --no-daemon \
    --console=plain \
    --warning-mode=summary
)
echo "ccache: $( (ccache --print-stats 2>/dev/null || true) | awk -F'\t' '/^direct_cache_hit|^preprocessed_cache_hit|^cache_miss/ { printf "%s=%s ", $1, $2 }')"
step_done

# ---------------------------------------------------------------------------
step "Artifacts"
ARTIFACT_FILE="$ARTIFACT_NAME.$FORMAT"
cp "$ARTIFACT_SRC" "$OUT/$ARTIFACT_FILE"
SHA256=$(sha256sum "$OUT/$ARTIFACT_FILE" | cut -d ' ' -f 1)
SIZE_BYTES=$(stat -c %s "$OUT/$ARTIFACT_FILE")
ELAPSED=$(( $(date +%s) - BUILD_START ))
cat > "$OUT/build-info.json" <<JSON
{
  "artifact": "$ARTIFACT_FILE",
  "format": "$FORMAT",
  "abis": "$ABIS",
  "sha256": "$SHA256",
  "sizeBytes": $SIZE_BYTES,
  "gradleTask": "$GRADLE_TASK",
  "durationSeconds": $ELAPSED,
  "builtAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "toolchain": {
    "java": "$(java -version 2>&1 | head -n 1 | sed 's/"//g')",
    "node": "$(node --version)",
    "ndk": "$(ls "$ANDROID_HOME/ndk" | head -n 1)"
  }
}
JSON
printf '%s      %s  %s MB  sha256 %s%s\n' "$C_OK" "$ARTIFACT_FILE" "$(awk -v b="$SIZE_BYTES" 'BEGIN { printf "%.1f", b / 1048576 }')" "$SHA256" "$C_OFF"
step_done

printf '\n%sBuild succeeded in %ss%s\n' "$C_OK" "$ELAPSED" "$C_OFF"
