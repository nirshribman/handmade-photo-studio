# Interface refinement - application 0.7.0

The artist and product-design review is applied. Renderer 0.6.0 and settings schema 6 are retained, so existing photographs, recipes, material assets and saved projects remain compatible.

## Editing flow

| Stage | Controls | Scope |
| --- | --- | --- |
| Compose | Photos, layout, crop, order, position, rotation | Whole composition; selected piece explicitly identified |
| Photo | Film, tone, B&W, grain, softness | All photos; individual offsets stay in the selected piece editor |
| Paper | Border, material, ink, edges, corners, wrinkles | Every paper piece; inner/outer edge amounts independent |
| Presentation | Album, mounts, lighting, shadows | Background and whole composition |
| Export | Preview, format, pixels, transparency, flatten colour, shadow | Download only |

The worktable occupies the main desktop area. On mobile it stays above an independently scrolling inspector. Larger preview / More controls changes their relative height. Tab arrows, Home and End navigate stages. Fine adjustments retain the complete control registry. Group expansion is preserved across stage changes.

Canvas selection uses the same geometry and rotation as the renderer. The selected outline and number are SVG overlays, excluded from output. Numbered thumbnails provide the keyboard alternative. The Hand tool and Alt-drag pan without changing the selected piece; wheel, pinch, area zoom, loupe and existing shortcuts are preserved.

## Feedback and visual choices

- Composition name, active photo count and explicit save state replace the main filename in the document header. The Compose source card identifies the main photo. Local saves use a document identity rather than the original photo identity, so independent sessions using the same source do not overwrite one another. Older saved records still open.
- Presets are in a compact on-demand browser. Modified reflects current settings versus the selected starting point, including undo.
- Film and material browsers render progressively using isolated instances of the canonical renderer. Finished cards are cached for the open browser. Film uses the current photo/crop; material cards show the artwork and a closer left-edge/surface crop. The Neutral film starting point disables stock response, grain and B&W while retaining manual tone.
- The export thumbnail follows output aspect, view, transparency, flatten colour and shadow. It is a scaled composition preview, not a full-resolution pixel/encoder inspection. It has its own renderer; closing the dialog or starting the full export releases preview resources.
- Text and hit areas are larger, secondary text is darker, icon-only actions have names, and dialogs have explicit accessible titles. The warm palette and serif identity are retained.
- Softness only controls detail loss. No sharpening has been introduced.

## Verification

Run npm.cmd run test:all. Existing image/renderer, crop, multi-photo, navigation, save, migration, alpha and real PNG/JPEG export checks are retained. workflow.spec.ts adds transformed canvas selection, editing scope, named save state and restoration, mobile inspector scrolling and preview resize, browser previews and undo, and thumbnail/export alpha checks.

Local screenshots and actual exports are under artifacts/ui-refinement/ (excluded from Git). Browser accessibility audits cover the editing stages, expanded edge controls and export dialog. Tiny stage numbers also receive a manual contrast check because automated contrast analysis can classify single digits as inconclusive.
