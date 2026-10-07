# syntax=docker/dockerfile:1.7
#
# Athletiq Android build toolchain.
# Everything that needs Java (Gradle, the Android SDK tools) runs inside this Linux image,
# so the host only needs Docker. Versions match what Expo SDK 57 / React Native 0.86
# resolve for this project (see node_modules/react-native/gradle/libs.versions.toml).
#
# The image contains tools only. Sources are mounted at /src when the container runs
# (see scripts/docker-android-build.ps1), so app changes never invalidate these layers.

ARG NODE_IMAGE=node:24-bookworm-slim
# JDK 17: the version React Native 0.86 and Android Gradle Plugin 8.12 support. Newer JDKs (24+) print a
# "restricted method" warning when AGP runs its prefab tool, and AGP treats that stderr output as a failure.
ARG JDK_IMAGE=eclipse-temurin:17-jdk-noble

FROM ${NODE_IMAGE} AS node

FROM ${JDK_IMAGE}

ARG ANDROID_CMDLINE_TOOLS=13114758
ARG ANDROID_PLATFORM=android-36
ARG ANDROID_BUILD_TOOLS=36.0.0
ARG ANDROID_NDK=27.1.12297006
ARG ANDROID_CMAKE=3.22.1

ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    GRADLE_USER_HOME=/root/.gradle \
    CCACHE_DIR=/root/.ccache \
    CCACHE_MAXSIZE=5G \
    CCACHE_SLOPPINESS=pch_defines,time_macros,include_file_mtime,include_file_ctime \
    NDK_CCACHE=/usr/bin/ccache \
    EXPO_NO_TELEMETRY=1 \
    EXPO_NO_GIT_STATUS=1 \
    CI=1
ENV PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${PATH}"

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates ccache curl git rsync unzip \
 && rm -rf /var/lib/apt/lists/*

# Node and npm from the official image (no extra apt repositories).
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
 && node --version && npm --version

# Android command-line tools, then the exact SDK packages this project needs.
RUN curl -fsSL -o /tmp/cmdline-tools.zip \
      "https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMDLINE_TOOLS}_latest.zip" \
 && mkdir -p "${ANDROID_HOME}/cmdline-tools" \
 && unzip -q /tmp/cmdline-tools.zip -d "${ANDROID_HOME}/cmdline-tools" \
 && mv "${ANDROID_HOME}/cmdline-tools/cmdline-tools" "${ANDROID_HOME}/cmdline-tools/latest" \
 && rm /tmp/cmdline-tools.zip

RUN yes | sdkmanager --licenses > /dev/null \
 && sdkmanager --install \
      "platform-tools" \
      "platforms;${ANDROID_PLATFORM}" \
      "build-tools;${ANDROID_BUILD_TOOLS}" \
      "ndk;${ANDROID_NDK}" \
      "cmake;${ANDROID_CMAKE}" > /dev/null \
 && sdkmanager --list_installed

COPY build.sh /usr/local/bin/athletiq-build
# Strip Windows line endings in case the file was checked out with CRLF.
RUN sed -i 's/\r$//' /usr/local/bin/athletiq-build && chmod +x /usr/local/bin/athletiq-build

WORKDIR /workspace
ENTRYPOINT ["athletiq-build"]
