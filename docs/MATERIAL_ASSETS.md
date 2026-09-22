# Material asset contract

Use one JSON manifest and aligned PNG/JPEG/static WebP files. Select all files together using the Paper material information panel. Filenames are plain local names, never paths or network URLs. Maps must match declared width/height (maximum 4096 × 4096), file hashes and colour-space semantics before upload to the renderer.

The full schema is implemented in `src/render/material-assets.ts`; `tests/fixtures/material/manifest.json` is a working example. Metadata required:

- `id`, `version`, `author`, `source`, `permission` (record actual redistribution permission).
- `status`: `captured`, `procedural` or `hybrid`; per-map `status`: `captured`, `inferred` or `procedural`.
- `sampleWidthMm`, `sampleHeightMm`: physical/virtual swatch dimensions, explicitly measured for claims of capture scale.
- `width`, `height`: aligned pixel dimensions; `tiling: "repeat"` and `fibreDirectionDeg`.
- `normalConvention: "OpenGL +Y"`. The renderer converts the vertical normal component into its top-down paper coordinates and rotates vectors with the maps.
- `maps`: any of `albedo`, `height`, `normal`, `roughness`, `coating`, `fibre`. Each declares `file`, `sha256`, `colourSpace` and `status`.

Albedo is colour and should declare `srgb`. All other channels are scalar/vector data and must declare `linear`. Height and roughness/coating/fibre use the red channel; normal uses RGB. Height is a relative artistic relief field controlled by tooth, not a measured absolute displacement claim. Albedo-only sets retain procedural height and roughness.

The renderer uses a common sheet transform for all channels, linear data sampling, aligned normal rotation, mipmaps and a declared physical swatch scale. UV repeat occurs in the sampler, preserving derivatives at tile boundaries. Choose a seamless swatch; this renderer does not remove baked lighting or synthesize larger patches automatically. Fibre direction is descriptive metadata; use the UI's Fibre direction control to rotate the entire aligned map set.

Installed original map files are included when **Save on this device** is explicitly chosen. Settings-only JSON pins the asset ID/version but does not contain map images. Restore the local project or reinstall the map set to reproduce it. `Download render information` reports asset/fallback status; the manifest stores SHA-256 channel hashes. No material URLs from settings or manifests are followed.

Do not call inferred normals, roughness inferred from a single photograph, or generated noise measured scans. The shipped validation fixture is labelled procedural throughout.
