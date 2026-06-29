# Release

## Build

Run:

```bash
./build.sh
```

Expected output:

```text
release/OCRSpaceOCR-v0.1.0.bobplugin
SHA256: <hash>
```

The script updates `appcast.json`.

## Package Contents

The build script uses a whitelist:

- `info.json`
- `main.js`
- `lib/`
- `icon.png`
- `README.md`
- `LICENSE`
- `docs/`

The package must not contain:

- `.git`
- `local_assets`
- `release`
- old `.bobplugin` or `.zip` files
- `test`
- `.DS_Store`
- `__MACOSX`
- logs, caches, or temporary files

## GitHub Release Checklist

1. Confirm the repository is not a fork.
2. Add the GitHub topic `bobplugin`.
3. Confirm `info.json.identifier` equals `appcast.json.identifier`.
4. Confirm `info.json.appcast` is `https://github.com/wakewon/OCRSpace/raw/main/appcast.json`.
5. Run `./build.sh`.
6. Confirm package SHA256 equals `appcast.json.versions[0].sha256`.
7. Create tag `v0.1.0`.
8. Create a GitHub Release for `v0.1.0`.
9. Upload `release/OCRSpaceOCR-v0.1.0.bobplugin`.
10. Open the raw appcast URL and confirm it is public.
11. Install the release asset in Bob and run `pluginValidate`.

