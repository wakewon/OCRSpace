#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

for cmd in jq zip shasum; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: missing required command: $cmd"
    exit 1
  fi
done

if [ ! -f info.json ]; then
  echo "Error: info.json not found. Run this script from the plugin root."
  exit 1
fi

IDENTIFIER="$(jq -r '.identifier // empty' info.json)"
VERSION="$(jq -r '.version // empty' info.json)"
MIN_BOB_VERSION="$(jq -r '.minBobVersion // empty' info.json)"
APPCAST_URL="$(jq -r '.appcast // empty' info.json)"

if [[ ! "$IDENTIFIER" =~ ^[a-z0-9]+(\.[a-z0-9]+)+$ ]]; then
  echo "Error: invalid identifier: $IDENTIFIER"
  exit 1
fi

if [ -z "$VERSION" ]; then
  echo "Error: missing info.json version"
  exit 1
fi

if [ -z "$MIN_BOB_VERSION" ]; then
  echo "Error: missing info.json minBobVersion"
  exit 1
fi

if [ "$APPCAST_URL" != "https://github.com/wakewon/OCRSpace/raw/main/appcast.json" ]; then
  echo "Error: unexpected info.json appcast URL: $APPCAST_URL"
  exit 1
fi

OUT_DIR="release"
PACKAGE_BASENAME="OCRSpaceOCR-v${VERSION}.bobplugin"
PACKAGE_PATH="${OUT_DIR}/${PACKAGE_BASENAME}"
DOWNLOAD_URL="https://github.com/wakewon/OCRSpace/releases/download/v${VERSION}/${PACKAGE_BASENAME}"
TMP_DIR="$(mktemp -d)"
BUILD_DIR="${TMP_DIR}/package"
APPCAST_TMP="$(mktemp)"

cleanup() {
  rm -rf "$TMP_DIR"
  rm -f "$APPCAST_TMP"
}
trap cleanup EXIT

mkdir -p "$OUT_DIR" "$BUILD_DIR"
rm -f "$PACKAGE_PATH"

copy_path() {
  local path="$1"
  if [ -e "$path" ]; then
    cp -R "$path" "$BUILD_DIR/"
  fi
}

copy_path info.json
copy_path main.js
copy_path lib
copy_path icon.png
copy_path README.md
copy_path LICENSE
copy_path docs

find "$BUILD_DIR" \( -name ".DS_Store" -o -name "__MACOSX" \) -print -delete

(
  cd "$BUILD_DIR"
  zip -qry "$ROOT_DIR/$PACKAGE_PATH" . \
    -x ".git/*" \
    -x "local_assets/*" \
    -x "release/*" \
    -x "test/*" \
    -x "tmp/*" \
    -x "*.bobplugin" \
    -x "*.zip" \
    -x "*.tmp" \
    -x "*.log" \
    -x ".DS_Store" \
    -x "__MACOSX/*"
)

SHA256="$(shasum -a 256 "$PACKAGE_PATH" | awk '{print $1}')"
TIMESTAMP="$(( $(date +%s) * 1000 ))"

if [ ! -f appcast.json ]; then
  jq -n --arg identifier "$IDENTIFIER" '{identifier: $identifier, versions: []}' > appcast.json
fi

APPCAST_IDENTIFIER="$(jq -r '.identifier // empty' appcast.json)"
if [ "$APPCAST_IDENTIFIER" != "$IDENTIFIER" ]; then
  echo "Error: appcast identifier ($APPCAST_IDENTIFIER) does not match info.json ($IDENTIFIER)"
  exit 1
fi

jq \
  --arg version "$VERSION" \
  --arg desc "OCRSpaceOCR ${VERSION} release" \
  --arg sha256 "$SHA256" \
  --arg url "$DOWNLOAD_URL" \
  --arg minBobVersion "$MIN_BOB_VERSION" \
  --argjson timestamp "$TIMESTAMP" '
  .versions = (
    if (.versions | map(.version) | index($version)) then
      .versions | map(if .version == $version then
        .sha256 = $sha256 |
        .url = $url |
        .minBobVersion = $minBobVersion |
        .timestamp = $timestamp
      else . end)
    else
      [{
        version: $version,
        desc: $desc,
        sha256: $sha256,
        url: $url,
        minBobVersion: $minBobVersion,
        timestamp: $timestamp
      }] + .versions
    end
  )
  ' appcast.json > "$APPCAST_TMP"
mv "$APPCAST_TMP" appcast.json

echo "Built: $PACKAGE_PATH"
echo "SHA256: $SHA256"
echo "Updated: appcast.json"

