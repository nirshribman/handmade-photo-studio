# Film, paper, and black-and-white rendering

Version: 1.0 · Research date: 2026-09-22  
Companion to [Handmade Photo Studio specification](./HANDMADE_PHOTO_STUDIO_SPEC.md), version 1.1.  
Purpose: implementation research and acceptance requirements for a controllable digital photo-finishing service. No profiles or material maps have yet been calibrated, implemented, or benchmarked.

## 1. The expanded product

The service should let someone choose three things independently: **how the photograph responds like film, how colours become black and white, and what kind of paper carries the image**. A deckled edge is just one property of the sheet. It does not describe the image's tonal response, photographic grain, or surface finish.

The original references remain the art direction for restrained, tactile photographic objects. The expanded service also needs convincing colour film, clean monochrome, smooth photographic paper, and an image-only export. Paper character must be useful even with clean edges; film must be useful without any paper treatment.

Implement three levels of vocabulary:

- **Film profile:** a reusable photographic response, with its own grain recommendations.
- **Paper material:** substrate colour, texture, coating, sheen, thickness, and ink interaction.
- **Artwork preset:** a complete arrangement combining photographic treatment, material, border, tears, and presentation.

The initial product provides fourteen film-inspired profiles, seven paper material families, dedicated B&W controls, and the six existing artwork presets. Keep these selectors distinct in the interface.

“Real paper effect” means a convincing digital rendering of a physical material. An exported PNG cannot change its sheen when a viewer moves, and it does not become a physically textured print. Provide an object presentation for sharing, a flat print-face export, and an image-only export; do not bake photographic shadows into the only available output.

## 2. Evidence and accuracy boundaries

Manufacturer descriptions and technical sheets establish film speed, process, broad grain behaviour, sensitivity, and intended response. They do not provide a complete, ready-to-use RGB filter. A finished film photograph also reflects exposure, illumination, lens, development, scanner, inversion, colour correction, and printing. There is no single universally correct “Portra colour” or “Tri-X contrast”.

The tables below separate **documented properties** from **our proposed reproduction**. Profile names in the app are descriptive original names. Reference stock names belong in an information panel and this research. This is an accuracy/product distinction, not a claim that naming a reference stock is prohibited.

Naming as of this research date: Kodak's current site lists [EKTACOLOR PRO](https://www.kodak.com/en/still-film/products/professional/ektacolor/) and [EKTAPAN](https://www.kodak.com/en/still-film/products/), while the older manufacturer data sheets linked below use PORTRA and T-MAX. Preserve the exact source names and dates in profile provenance. Do not infer identical chemistry, a distribution history, or current availability merely from similar descriptions. The initial Portrait Negative and Fine Detail Mono targets below use the explicitly cited PORTRA 400 and T-MAX 100 sheets.

### What an ordinary uploaded image cannot supply

- A JPEG is already processed and usually tone-mapped. Linearising sRGB removes its transfer function; it does not recover raw scene radiance or reverse the camera's processing.
- Clipped highlights, crushed shadows, missing colour channels, and discarded high-frequency detail cannot be recovered by a film profile.
- RGB values do not uniquely identify a scene's spectrum. Virtual film sensitivity and coloured B&W filters are approximations.
- Film ISO is a capture sensitivity, not a digital “grain amount”. Do not change exposure metadata or claim to change the source camera's ISO.
- Do not infer the artist's film stock from the supplied print photographs. Their texture mixes image, ink, support, and the camera used to photograph the artwork.

Use “film-inspired” in profile information until paired measurements justify a narrower claim. The stock references support direction; all numerical seed recipes in Section 4 are our design proposals.

## 3. Fourteen researched film directions

### 3.1 Colour negative and reversal profiles

| App profile and stable ID | Reference and documented properties | Proposed digital reproduction | Useful subjects and cautions |
|---|---|---|---|
| Portrait Negative 400 · `portrait-400` | [Kodak PORTRA 400, E-4050](https://www.kodakprofessional.com/sites/default/files/wysiwyg/pro/resources/e4050_portra_400.pdf): ISO 400 colour negative; fine grain for its speed; emphasis on natural skin reproduction and scanning. | Smooth highlight compression, moderate chroma, gentle hue shaping, fine correlated colour grain. Keep neutral greys neutral by default. | Portraits, everyday scenes, soft daylight. A compulsory orange cast or pastel wash would be our added grading, not a demonstrated stock property. |
| Vivid Negative 100 · `vivid-100` | [Kodak EKTAR 100](https://www.kodak.com/en/still-film/product/professional/ektar-100-film/): daylight ISO 100 colour negative; fine grain, sharp detail, enhanced saturation. | Stronger colour separation and chroma than Portrait Negative; fine grain; preserve highlight detail and use gamut compression. | Landscape, architecture, colourful objects. Test skin and saturated red objects for clipping. |
| Everyday Colour 200 · `everyday-200` | [Kodak GOLD 200](https://www.kodak.com/en/still-film/product/consumer/gold-200-film/) and [E-7022](https://www.kodak.com/global/plugins/acrobat/en/consumer/products/techInfo/e7022/E7022.pdf): daylight colour negative with broad exposure latitude and a stated print-grain measurement context. | Moderate contrast, lively colour, slightly warm creative balance and visible but restrained grain. | Travel, family, casual daylight. The warmth is a proposed interpretation; do not turn all skin yellow. |
| Vivid Slide 50 · `vivid-slide-50` | [Fujifilm Velvia 50 data sheet](https://asset.fujifilm.com/www/it/files/2019-09/3d88b84d7cbd43d8c3a32ca72d107ae4/films_velvia-50_datasheet_01.pdf): daylight ISO 50 reversal; very saturated colour, fine granularity, neutral greys. | Firm tonal separation, strong selective chroma, fine grain and deliberate endpoint compression. Keep smooth hue transitions. | Foliage, sunsets, graphic landscapes. Avoid treating every shadow as black or adding a universal green cast. |
| Balanced Slide 100 · `balanced-slide-100` | [Fujifilm PROVIA 100F data sheet](https://asset.fujifilm.com/www/it/files/2019-09/4ca5dfc19ecbea6b26c635b5079d6ff3/films_provia-100f_datasheet_01.pdf): daylight ISO 100 reversal; fine grain, controlled gradation, broad subject use. | Clear contrast and clean colour with less extreme chroma than Vivid Slide; fine grain and neutral highlights. | Landscapes, objects, editorial images. Differences must remain visible with grain disabled. |
| Clean Slide 100 · `clean-slide-100` | [Kodak EKTACHROME E100](https://www.kodak.com/en/still-film/product/professional/ektachrome-e100-film/): daylight ISO 100, E-6 reversal; fine grain, moderate saturation enhancement and neutral tonal scale. | Neutral highlight/grey behaviour, moderately vivid colour, clean texture and a separate tone curve from the other slides. | Architecture, travel, colour details. Do not identify E100 with an arbitrary blue filter. |
| Tungsten Night · `tungsten-night` | [CineStill 800T product information](https://cinestillfilm.com/collections/nfl/products/800tungsten-c41-36exp-35mm-high-speed-color-negative-135): EI 800, tungsten balance, C-41-compatible, remjet-free film. [Manufacturer explanation](https://cinestillfilm.com/blogs/news/cinestill-800t-in-your-toolbox) describes reddish halation around bright points and its dependence on the scene. | Adjustable cool balance, preserved warm practical lights, moderate colour grain and thresholded red-orange highlight scattering. Halation remains separately adjustable. | Night streets, bulbs, windows, neon. Red outlines around every edge are incorrect. This is not a generic claim about every cinema negative. |

Colour-negative and reversal profiles both produce normal positive images in this product. The renderer must not leave an orange negative mask or invert the image simply because a negative stock was selected. Scanner/inversion rendering is part of a profile's documented target, not a literal channel inversion.

### 3.2 Black-and-white profiles

| App profile and stable ID | Reference and documented properties | Proposed digital reproduction | Useful subjects and cautions |
|---|---|---|---|
| Classic Documentary 400 · `classic-400` | [Kodak TRI-X 400](https://www.kodak.com/en/still-film/product/professional/tri-x-400-film/): panchromatic B&W negative, ISO 400, classic grain and broad exposure latitude. | Moderately prominent clustered grain, strong midtone separation, a shaped toe and retained highlight gradation. | Street, portrait, atmospheric scenes. High contrast is a chosen rendering, not an immutable Tri-X property. |
| Flexible Mono 400 · `flexible-400` | [ILFORD HP5 PLUS](https://www.ilfordphoto.com/hp5-plus-35mm): ISO 400, medium contrast, conventional emulsion and broad exposure tolerance. | More open midtones than Classic Documentary at the proposed defaults; visible traditional grain and smooth highlights. | Documentary, low light, general B&W. Exposure and developer affect the result. |
| Fine Classic 125 · `fine-classic-125` | [ILFORD FP4 PLUS](https://www.ilfordphoto.com/fp4-plus-35mm): ISO 125, fine grain, medium contrast and high sharpness. | Smaller grain and restrained contrast; preserve fine foliage, distant layers and skin transitions. | Quiet landscapes, daylight portraits, paper editions. Do not blur it to make it “old”. |
| Clean Modern 100 · `clean-modern-100` | [ILFORD DELTA 100](https://www.ilfordphoto.com/delta-100-professional-35mm): fine-grain ISO 100 B&W. ILFORD describes its [DELTA versus PLUS approach](https://www.ilfordphoto.com/hp5-vs-delta-professional-400/?___from_store=ilford_uk&___store=ilford_brochure) as a different emulsion design; Core-Shell is not Kodak T-GRAIN. | Fine, less clustered grain, precise tonal separation and restrained softness. | Architecture, portraits and detailed monochrome. Do not model it as the same grain bitmap with a new label. |
| Fine Detail Mono 100 · `fine-detail-100` | [Kodak T-MAX 100, F-4016](https://www.kodakprofessional.com/sites/default/files/wysiwyg/pro/resources/f4016_TMax_100.pdf): panchromatic ISO 100, T-GRAIN, high resolving power and very fine grain. | Very fine grain, clean edges and smooth tonal scale; distinct curve from Clean Modern. | Fine detail, architecture, prints that emphasise surface rather than image grain. |
| Smooth Tonal 100 · `smooth-tonal-100` | [Fujifilm ACROS II](https://www.fujifilm.com/us/en/business/professional-photography/film/neopan-100-acros-ii) and [120 data sheet](https://asset.fujifilm.com/www/us/files/2020-08/ed6acf9a3aeefed477d0f169df7c8457/films_neopan100acros2_120_01.pdf): ISO 100, fine grain, rich gradation and orthopanchromatic sensitivity. | Fine grain and smooth upper-midtones; an adjustable RGB approximation of its sensitivity, without pretending to reconstruct spectra. | Water, architecture, mist and quiet tonal work. Do not confuse orthopanchromatic with completely red-insensitive ortho film. |
| Available Light Mono · `available-light-mono` | [ILFORD DELTA 3200 technical sheet](https://www.ilfordphoto.com/amfile/file/download/file/1913/product/682/): ISO 1000 in the stated ID-11 test, commonly used at higher exposure indices including EI 3200. | Coarser visible grain, exposure-dependent shadow texture, compressed bright sources and optional stronger development character. | Dark interiors, performance and expressive monochrome. “3200” does not establish a true ISO 3200 measurement. |

Do not add a “long exposure” filter to imitate ACROS reciprocity behaviour on a finished JPEG. Exposure-time sensitivity is a capture property, not a surface texture. Similarly, do not make fake edge codes, dust, scratches, frame borders or light leaks compulsory parts of any stock profile.

## 4. Starting digital recipes and profile structure

These are **uncalibrated design seeds**, useful for making the first implementation concrete. They are not manufacturer measurements or fitted LUTs. Grain values use the UI ranges in the main specification. Tone descriptors must be authored as smooth functions or LUTs with recorded versions.

| Profile ID | Curve target | Relative chroma target | Grain amount / size / clustering / chroma | Halation / bloom | Suggested first paper |
|---|---|---|---|---|---|
| portrait-400 | Soft shoulder, moderate midpoint slope | 0.95 | 16 / 24 / 15 / 15 | 0 / 0 | smooth |
| vivid-100 | Firm midtones, protected highlights | 1.18 | 9 / 18 / 10 / 12 | 0 / 0 | baryta |
| everyday-200 | Moderate contrast, gentle toe | 1.08 | 23 / 32 / 25 / 20 | 0 / 0 | lustre |
| vivid-slide-50 | Firm toe and midtones | 1.28 | 9 / 17 / 8 / 10 | 0 / 0 | baryta |
| balanced-slide-100 | Clear midtones, smoother toe | 1.08 | 10 / 18 / 10 / 10 | 0 / 0 | smooth |
| clean-slide-100 | Neutral greys, clean highlights | 1.10 | 10 / 19 / 10 / 10 | 0 / 0 | lustre |
| tungsten-night | Soft highlights, open midtones | 0.95 | 30 / 34 / 20 / 22 | 30 / 5 | baryta |
| classic-400 | Firm midtones, shaped toe | B&W | 30 / 35 / 40 / 0 | 0 / 0 | cotton |
| flexible-400 | Medium contrast, open midtones | B&W | 27 / 34 / 34 / 0 | 0 / 0 | soft-kozo |
| fine-classic-125 | Gentle midtones, gradual shoulder | B&W | 14 / 24 / 25 / 0 | 0 / 0 | cotton |
| clean-modern-100 | Clean separation, restrained toe | B&W | 10 / 20 / 12 / 0 | 0 / 0 | smooth |
| fine-detail-100 | Smooth scale, firm fine detail | B&W | 8 / 18 / 10 / 0 | 0 / 0 | baryta |
| smooth-tonal-100 | Smooth upper-midtones | B&W | 9 / 19 / 12 / 0 | 0 / 0 | soft-kozo |
| available-light-mono | Open middle, compressed peaks | B&W | 43 / 44 / 25 / 0 | 0 / 0 | cotton |

The chroma target is a starting overall ratio for authoring a profile, not a new user slider or sufficient implementation by itself. Each colour profile needs documented hue relationships and neutral behaviour; each B&W profile needs a documented curve and sensitivity approximation. The table must become versioned data, with original authored functions and visual fixtures. Fourteen aliases to the same filter fail acceptance.

### Loading a profile

Selecting a film profile is one undoable action that sets its film response, recommended grain values, and B&W state. It visibly updates those three panels. Colour profiles set B&W off; B&W profiles set B&W on at 100. Preserve crop, paper, edges, lighting, layout, source, independent seeds and the user's basic exposure/finishing tone adjustments. Paper suggestions in the table are suggestions only.

For a complete initial film recipe, start film/grain/B&W controls from the main spec's neutral defaults, preserve their seeds, and then apply the table. Enable film at 100 and grain at the listed amount; use 35mm format and shadow bias 0. Reset B&W filters to None, six mixer bands to 0, print contrast to 0 and toner to Neutral/0. Set B&W enabled/100 for B&W stocks and disabled/0 for colour stocks. Film balance is 0 except Tungsten Night at −25. Curves/hue response are part of the profile's authored transform; the response and colour mix controls start at 100. Halo/glow radii and thresholds use their main-spec defaults. Choosing `none` is a stock-response bypass, not a full profile recipe: it preserves independent grain/B&W and explicit manual glow controls. Group Reset is a separate action.

After loading, the groups remain independent. “Film response” strength controls the response curve, colour character and highlight effects; “Grain amount” and “Black & white” have their own strengths. Setting Film response to zero therefore keeps independently selected grain and B&W. “Finish strength” controls all groups. Explain this with the three visible controls, rather than a hidden linkage that resets manual choices.

Store `profileId`, `profileVersion`, `family`, `referenceSources`, `calibrationStatus`, curve domain, curve/LUT asset hash, colour transform, sensitivity weights, grain recommendations, highlight-effect recommendations, author, and validation fixture IDs. Do not copy library defaults into a saved recipe implicitly on load: save resolved settings and pin profile/material versions.

### How to improve fidelity later

1. Choose a precise target: stock + format + exposure + developer/process + scanner/scan settings or print/viewing conditions.
2. Photograph a neutral step wedge, colour chart, skin, fabric, foliage and bright light sources on film and a characterised digital camera under matched conditions. Record bracketed exposure and processing. Use original or authorised captures.
3. Scan consistently with automatic enhancements disabled or documented; characterise the scan path and remove base/mask through a repeatable negative conversion.
4. Fit neutral tone curves and smooth colour transforms separately from grain. Hold out real scenes from fitting.
5. Estimate grain variance by density, autocorrelation/power spectrum, channel covariance and apparent scale at a known scan magnification. Measure halation from suitable bright/dark transitions.
6. Compare held-out scenes, log residuals and tradeoffs, and label the exact pipeline that was fitted. Digital emulation still does not recover missing source information.

This measured calibration is a later quality tier. The first release must ship working, honest, visually differentiated approximations.

## 5. Digital film renderer

### 5.1 Colour response

Use explicitly normalised SDR sRGB input. Maintain sufficient intermediate precision to apply exposure and compress highlights before clipping. Inverse sRGB is a working approximation, not an inverse camera pipeline. Define the profile domain, white reference, endpoints, gamut handling and interpolation; never apply a LUT built for log footage directly to an sRGB JPEG.

Use a monotonic luminance curve for the neutral response and a smooth colour transform for hue/chroma relationships. A 3D LUT can accelerate a colour transform, but it cannot independently model image-neighbour effects such as grain, halation or paper shading. This distinction follows [NVIDIA's primary explanation of LUTs](https://developer.nvidia.com/gpugems/gpugems2/part-iii-high-quality-rendering/chapter-24-using-lookup-tables-accelerate-color).

For the first renderer, author smooth analytic transforms and bake them into versioned 33³ LUTs where helpful, or evaluate them directly if performance is adequate. Use trilinear interpolation consistently in preview/export and an analytic reference to assess LUT error. Validate neutrals, saturated ramps, hue wraparound, and values at the domain boundary. Larger LUTs are a measured improvement, not a guarantee of accuracy.

Keep three contributions distinct: neutral response curve; colour character; spatial highlight effects. `film.responseMix` and `film.colourMix` control the first two independently. A stock profile at full response must still preserve readable highlight gradation when the source contains it.

### 5.2 Halation and bloom

Halation suggests light spreading within/back through film. Bloom suggests a broader optical glow. These need different kernels and colour treatment. The [CineStill FAQ](https://cinestillfilm.com/pages/frequently-asked-questions) describes the internal reflection and red-sensitive layer relationship; our renderer approximates its appearance.

Construct a soft threshold from exposed source luminance in the unassociated working image. Blur the extracted bright-light energy at a stable source-space radius. A narrow red/orange-biased halo and a broader, largely neutral glow are separate contributions. Include a support region around bright objects and suppress a hard outline at the threshold. Scale both by film strength once.

Use separate `halationThreshold` and `bloomThreshold` values. Their soft transition bands prevent hard contours; changing one must not change the other's mask. Both are evaluated against the same exposed reference white, not each image's brightest pixel or its histogram maximum.

Derive the mask from source highlights before adding glow, never from the composed white paper border or stage. Halation should disappear when there are no qualifying highlights. Do not feed its own output back into the threshold. No glow may be caused merely by a transparent source pixel. B&W conversion makes the resulting image halo achromatic at full B&W.

Most profile defaults use zero visible halation. A washed-out sky does not prove that a film stock should have a large glowing outline. Use a shared implementation for preview/export; account for full kernel support in any future tiled renderer.

### 5.3 Grain

A plausible grain model has spatial scale, irregularity, density-dependent amplitude, and colour-channel relationships. It must not be a fixed grey overlay. [Newson, Faraj, Galerne and Delon](https://www.ipol.im/pub/art/2017/192/) demonstrate a stochastic, resolution-independent approach. That work informs the quality target; its supplied implementation has its own licence and is not an automatic dependency.

Release 1 can use an independently authored, band-limited stochastic approximation with a shared low-frequency component and independent fine components. Define colour-grain covariance rather than using identical RGB noise or unrelated colourful confetti. Conventional B&W output uses one scalar grain field. Colour grain may contain a modest chroma component. At full B&W, suppress grain chroma regardless of its latent colour setting.

Calibrate mean response after nonlinear density conversion: zero-mean density noise does not automatically preserve mean reflectance. Grain amount should not noticeably alter the mean tone of a uniform patch. Use density-conditioned amplitude curves, protect endpoints, and antialias unresolved frequencies.

`grain.format` changes the virtual film-plane scale: 35 mm, medium format, or large format. It does not change crop or framing. For a proposed relative scale model use short sides 24, 56 and 102 mm respectively; apparent grain size for the same virtual grain is inversely proportional to that short side. These are virtual format references, not claims about every camera gate. The size slider is an additional relative multiplier. Anchor grain to the full oriented source before crop; a tighter crop magnifies its grain naturally.

Paper scale belongs to the sheet and does not change when film format changes. Splitting the photograph must not restart grain in every tile. Zoom must reveal a fixed field, not reseed it. Use the same saved seed and underlying coordinates for downsampled preview and export.

### 5.4 Exposure and development character

The basic Exposure control changes input level before film response. A separate Development character control interpolates a documented response variant: more/less midpoint contrast, modified toe/shoulder and modest density-dependent grain emphasis. The slider is an aesthetic approximation, not a lab instruction or an automatic ISO conversion.

For Release 1, its domain is −2 to +2 with 0 normal; positive means a stronger/push-like rendering, negative a gentler/pull-like rendering. Do not apply an extra exposure change secretly. No latent shadow detail is invented. The renderer may modulate existing grain only; `grain.enabled=false` and grain amount 0 always suppress grain. Validate negative, neutral, and positive variants per profile.

## 6. Dedicated black-and-white workflow

B&W needs decisions about how colours map to brightness, how tones separate, and how the final print is tinted. Desaturation alone is not enough. The main spec replaces `tone.monochrome` with the independent `bw` group.

### 6.1 Conversion and filters

Start with linear sRGB luminance weights (0.2126, 0.7152, 0.0722). Use a profile's documented positive sensitivity weights where available as an RGB approximation. Normalise weights to preserve neutral grey. Do not apply a black-and-white conversion twice.

Offer None, Yellow, Orange, Red, Green and Blue filter looks, with a strength control. Their direction follows [ILFORD's explanation of colour filters](https://www.ilfordphoto.com/colour-filters/?___from_store=ilford_uk&___store=ilford_brochure): yellow/orange/red progressively separate blue skies from clouds; green favours green subjects; blue favours blue subjects and can darken warm colours. These are relative mappings, not guaranteed outcomes for every skin tone or scene. RGB cannot recover infrared or remove real atmospheric haze.

For explicit initial digital weights, multiply the baseline RGB sensitivity by: None (1,1,1), Yellow (1.1,1.1,0.45), Orange (1.5,0.8,0.2), Red (2.2,0.25,0.08), Green (0.5,1.5,0.4), Blue (0.25,0.6,2.0), then renormalise. Interpolate from None by filter amount before conversion. These numbers are original starting values, not measured optical filter spectra. Auto-normalisation maintains neutral brightness; an optical filter's exposure loss is not silently added.

Advanced colour-to-grey controls: Reds, Yellows, Greens, Cyans, Blues and Magentas. Each ranges −100 to +100 around 0. Build overlapping, smooth hue bands on the chromatic input before conversion; positive brightens that band and negative darkens it. Fade adjustments near achromatic pixels where hue is unstable, normalise overlap, prevent hard seams, and protect endpoints. Do not divide by near-zero saturation. Set all six to 0 for an exact baseline.

### 6.2 Print tone and toning

- **Print contrast:** a smooth additional monochrome curve after conversion. It is a creative grade approximation, not a measured numbered photographic-paper filter.
- **Toner:** Neutral, Warm/Sepia, Cool or Selenium-inspired; strength 0–100. Neutral and amount 0 are identical. Toning affects printed image tones, not paper white.
- **Existing basic tone:** Exposure remains upstream; shadows, highlights, contrast, matte blacks and warmth remain independent finishing controls. Show active warmth/toner when the result is intentionally tinted.

At full B&W with neutral toner, neutral basic warmth, zero fragment tint and neutral material, R=G=B within quantisation tolerance. Warm paper, coloured print toner or intentionally varied fragment tone may colour the final object without invalidating monochrome image conversion.

A greyscale source has no original colour separation to recover. Disable or explain colour-filter/mixer controls when they have no meaningful effect. They must not invent selective masks from subjects. Local dodge/burn, region masks, infrared simulations, duotone spot inks and a calibrated darkroom printer model remain later features.

### 6.3 Processing order and group independence

Use this shared logical order:

1. Decode, orient, normalise colour, then apply basic input Exposure.
2. Extract and add source-based halation/bloom if enabled.
3. For a colour film profile, apply its neutral curve and colour response.
4. Perform the single B&W conversion/filter/mixer/print-grade/toner branch and blend by effective B&W strength.
5. For a B&W film profile, apply its neutral luminance curve here. At partial B&W it scales RGB by the luminance ratio, preserving remaining chroma; it does not force another conversion.
6. Apply one grain engine with full-B&W chroma suppression.
7. Apply remaining basic finishing tone, then per-piece tone variation.
8. Apply ink/support interaction and material lighting, then arrangement and export.

A colour profile followed by B&W is intentionally a colour-rendering-then-monochrome combination. A B&W profile uses its sensitivity approximation before its B&W response curve. Switching a profile never changes the source file. Changing film response strength does not override the independent B&W conversion or grain amount.

## 7. Realistic paper materials

### 7.1 Seven material families

| Material ID | Physical reference and evidence | Digital construction and proposed starting values |
|---|---|---|
| `soft-kozo` | [Awagami inkjet washi](https://awagami.com/collections/inkjet-papers) retains fibre character with a print-receiving coating. [Bizan](https://awagami.com/products/bizan-handmade-medium-200gsm-natural-deckle-edges) demonstrates a textured handmade sheet with organic deckles. | Long sparse fibres, low broad mottling, gentle relief, diffuse finish. Tooth 24, fibres 18, mottling 12, sheen 2, roughness 90, thickness 0.35 mm. |
| `cotton` | A general lightly textured cotton art-paper direction; the supplied artist's gravure listing names Somerset Satin. Do not equate all cotton with rough watercolour paper. | Short felt-like structure, restrained broad texture, matte coating. Tooth 20, fibres 4, mottling 8, sheen 2, roughness 85, thickness 0.45 mm. |
| `smooth` | [Canson Rag Photographique](https://www.canson-infinity.com/en/products/rag-photographique) documents an extra-smooth matte cotton support. | Small surface variations, little visible fibre, clean detail and subtle warm/neutral base. Tooth 6, fibres 0, mottling 3, sheen 1, roughness 90, thickness 0.40 mm. |
| `cold-press` | [ARCHES Aquarelle Rag](https://www.canson-infinity.com/en/products/archesr-aquarelle-rag) describes a textured cotton base with felt marks and an inkjet layer. | Coarser coherent depressions, gentle broad relief, restrained dry ink interaction. Tooth 45, fibres 5, mottling 10, sheen 1, roughness 95, thickness 0.50 mm. |
| `baryta` | [Hahnemühle Photo Rag Baryta](https://www.hahnemuehle.com/en/digital-papers/fineart-collection/glossy-fineart/p/Product/show/5/21.html) combines a cotton base with a high-gloss inkjet coating containing barium sulphate. | Fine relief, smooth sheen, deep diffuse blacks with a restrained specular surface response. Tooth 8, fibres 0, mottling 3, sheen 22, roughness 35, thickness 0.40 mm. |
| `lustre` | [ILFORD's paper guide](https://www.ilfordphoto.com/wp/wp-content/uploads/2017/04/Making-your-first-print.pdf) distinguishes RC/FB supports and glossy, pearl and matte surfaces. | Fine pebbled coating texture, broad broken reflections, minimal exposed fibres. Tooth 12, fibres 0, mottling 2, sheen 15, roughness 55, thickness 0.25 mm. |
| `creased-kozo` | The user's dark cover suggests kneaded/creased fibre paper; the precise technique remains unconfirmed. | Kozo base plus an explicit wrinkle recipe: strength 35, size 45, density 45. Tooth 18, fibres 15, mottling 10, sheen 2, roughness 90, thickness 0.30 mm. |

All numeric values in this table are proposed renderer defaults, not measurements of the named products. Material strength starts at 65 when a material recipe is loaded. Each recipe also supplies a documented editable base colour. Smooth defaults to #FAF9F5, baryta/lustre to #FAFAF7, and other families to #F3EEDC. The existing six artwork presets keep their explicitly chosen colours.

Loading a material recipe updates paper and ink interaction recommendations; Creased Kozo also visibly enables its wrinkle recipe. This is one undoable action. It does not choose a film, convert to B&W, change the composition, or change edge style. Clean-cut baryta and torn baryta are both possible. Deckle shape, material fibres and border width remain separate.

Complete initial material recipes use the table's paper values, material strength 65, textureScale 1, rotation 0, fibreSize 35 and no captured asset until a valid set is supplied. Starting ink strength/spread/densityVariation are: kozo 20/6/8, cotton 20/4/6, smooth 0/0/0, cold-press 30/8/12, baryta 0/0/0, lustre 0/0/0, creased-kozo 20/6/8. Coverage loss and gravure character start at 0; paperCoupling is 50. These are deliberately conservative because a coated support need not lose ink coverage. Non-creased material choices preserve the user's wrinkle settings; Creased Kozo visibly applies the specified wrinkle recipe. Material selection preserves seeds, lighting and edge settings. When loading an installed captured variant, additionally set its asset ID/version and assetMix 100; retain procedural fallbacks for missing channels.

### 7.2 Material fields, not a texture overlay

Represent each paper using independent but related fields:

| Field | Role | Failure if omitted or confused |
|---|---|---|
| Albedo/base colour | Unlit paper colour, fibre colour and low-frequency variation. | Baked shadows remain fixed when lighting changes. |
| Height/normal | Surface slopes from tooth, waviness and creases. | Texture looks printed onto the surface. |
| Roughness | Spatial width and breakup of reflections. | Smooth and pebbled papers look identical or plastic. |
| Coating/sheen | Strength of the dielectric surface reflection. | Glossy material becomes only brighter or more saturated. |
| Thickness/edge body | Small sidewall and contact cues at the silhouette. | Sheet reads as a transparent sticker. |
| Fibre/coverage fields | Visible sparse fibres and controlled ink interaction. | Every fibre becomes an identical black scratch. |

This map-based approach is consistent with documented material workflows such as [Adobe's material properties](https://helpx.adobe.com/substance-3d-stager/desktop/using-stager/add-materials-and-textures.html). The renderer below is our proposed simplified implementation.

### 7.3 Captured materials and procedural fallback

Promote a small material library into Release 1: aim for at least three original or redistribution-licensed material sets covering fibrous matte, smooth matte, and a coated photographic surface. All seven families also need deterministic procedural fallbacks. A material selection may be procedural, captured, or hybrid; display its provenance in material information. Do not call a generated noise field a real scan.

A material asset manifest must include ID/version, author/source, redistribution permission, captured/procedural/hybrid status, maps with content hashes and colour spaces, sample width/height in mm, native dimensions, tiling policy, fibre direction and available channels. An albedo-only asset does not have measured normals or roughness.

For original capture, use a fixed perpendicular camera, a scale reference, uniform exposure, colour reference and controlled light. A diffuse/cross-polarised capture can help isolate colour. Multiple known light directions support estimating surface normals; extra specular observations help characterise coating. Height inferred from normals needs integration and boundary assumptions. A single shaded photograph cannot uniquely establish all these physical maps. [Adobe's B2M documentation](https://helpx.adobe.com/substance-3d-b2m/desktop/parameters.html) illustrates that image-derived maps require assumptions and lighting removal; do not relabel inferred maps as measured.

Clean dirt and lens shading from a material capture while retaining its actual paper variation. Do not erase all low-frequency character. Prefer large swatches with controlled overlap/stochastic sampling over an obvious small repeated tile. Any patch synthesis must share transforms across albedo, normal and roughness maps, including normal-vector rotation. Never randomly rotate only the colour layer.

Suggested source maps: 2K for interactive use, 4K where the intended physical sample size and output detail warrant it. Choose map resolution by sampling density, not by labelling every 4K map “high quality”. Generate mip levels and prevent texture swimming. Include their GPU memory in the renderer budget.

If licensed/captured assets are unavailable, continue building the functional renderer using original procedural materials. Report the missing captured-material quality gate; do not silently declare the entire realistic-material deliverable complete or pause unrelated implementation. This document specifies the acquisition/capture task but does not claim to have acquired those assets.

### 7.4 A bounded physical appearance model

Use a shallow material surface with an orthographic camera, one shared area-light direction and neutral ambient fill. Height-derived normals affect diffuse and specular response. Use a nonmetallic, energy-bounded diffuse-plus-microfacet approximation; the paper is not a metal. Roughness changes highlight width, sheen changes its relative strength, and light size affects softness. Neither should be an arbitrary grey overlay.

Apply image reflectance/ink density to the substrate, then illuminate the surface. Allow the coating to influence both the image and unprinted margin. Keep ink interaction adjustable: coated papers can retain crisp detail despite visible underlying texture. Paper tooth alone must not imply missing ink, and a fibre-rich paper is not automatically extremely absorbent because inkjet receiving layers matter.

Thickness is independent of elevation: thickness describes the sheet; elevation is its gap above the stage. Use thickness for a very thin silhouette-side cue/contact response and elevation for cast-shadow spread/offset. At front-on view, avoid a uniform dark stroke around all four sides. Large folds, undercuts, overlap and true corner curl require geometry beyond this shallow model and remain deferred.

All material maps occupy the same sheet coordinates. A torn split preserves the parent sheet's field continuity. Changing a light angle must relight the same bumps, not replace them. Paper texture must remain the same size at the same nominal physical sheet size when export resolution changes.

Treat `paper.thicknessMm` and `paper.textureScale` as virtual dimensions. Add `composition.shortSideMm` (default 150) to map millimetres into the existing 1,000-unit sheet coordinate system. This is a preview scale reference, not a guarantee of printer size or an automatic DPI tag. The underlying existing tooth/fibre controls remain relative; captured maps use their declared physical swatch size, modified by textureScale.

### 7.5 Three export views

- **Artwork object:** current arranged pieces, simulated material lighting, edges, borders, optional shadow, and stage. This reproduces the photographed-object presentation of the references.
- **Flat print face:** same paper albedo, image, ink character, shape and layout, but uniform illumination with no directional sheen, material shading, sidewall or cast shadow. Useful for further design/printing; it remains a simulated surface colour, not a print proof.
- **Image only:** photographic processing through finishing tone; no paper, ink texture, borders, tears, piece gaps, stage, or shadows. Use the user's source crop and require dimensions consistent with that crop. This is the film/B&W result as a conventional image.

Export view is explicit and previewable. It does not rewrite the saved recipe. Use the same photographic intermediate in all three outputs. Never claim colour-accurate physical print matching without a characterised printer/paper/profile workflow.

## 8. Interface and independent strengths

Basic interface: Film selector; Film response; Grain amount; B&W toggle/amount; Paper selector; Paper character; Edge character; Light & depth. Show the dominant visual choices first, and disclose the detailed inspector groups on demand.

Advanced controls include response-versus-colour mix, development character, halation amount/radius/threshold, bloom amount/radius, film grain size/clustering/chroma/format, B&W lens filters and six colour bands, print contrast and toner, paper map amount/scale/rotation, sheen/roughness/thickness, light angle/height/softness, and the existing ink/edge/layout controls.

Provide compare modes for Source, Photo treatment only and Final artwork. These are views; they do not mutate parameters. A small 100% detail viewport should show texture without zooming the entire arrangement out of view. Include a temporary moving-light inspection gesture that returns to the saved light when released; it must not animate exports or mutate undo history.

Use meaningful disabled states. Halation needs qualifying source highlights; gloss needs nonzero sheen and lighting; roughness only changes an active specular response; colour grain has no chroma at full neutral B&W; film colour mix is inactive for a B&W profile. Preserve latent values instead of silently resetting them.

## 9. Acceptance tests added to the main specification

1. **Independent groups:** film response 0 leaves manually selected grain/B&W/material intact; Finish 0 neutralises all finishing contributions; loading a film never changes paper or crop.
2. **Distinct profiles:** render the same colour chart, portrait, daylight landscape and night scene through all fourteen profiles. Inspect grain-off and texture-off outputs as well as normal presets. Record authored differences; do not manufacture implausible colour casts solely to exaggerate distinction.
3. **Neutral axis:** neutral grey ramps remain neutral for neutral colour profiles, no intentional tint, with material off. Smooth gradation has no hue seams or visible contouring.
4. **B&W correctness:** full neutral B&W gives equal RGB channels in its photographic intermediate, including grain. Filter/mixer changes modify appropriate coloured patches while achromatic patches remain stable. Toner never tints the blank margin directly.
5. **Highlight isolation:** a bright bulb on dark input produces a local halo; a medium-grey image on white paper does not. Halation and bloom can be independently removed. Transparent pixels do not emit light.
6. **Grain:** mean uniform-patch tone remains stable, grain statistics change with density and format, and no texture appears in blank borders. Crop and split tests retain one continuous field. Size stays stable across preview/export.
7. **Paper relighting:** on plain grey and image-bearing sheets, rotate light 180 degrees. Bumps relight coherently; albedo stains remain fixed; no baked second shadow persists. Roughness broadens/narrows reflections without reseeding texture.
8. **Material diversity:** fibrous, smooth, rough and coated families differ at normal size and detail scale. Gloss does not become metallic. A high-quality coated-paper preset does not automatically have dry gaps.
9. **Maps and versions:** asset hashes, map alignment, units and fallback status survive save/import. Missing material assets produce an explicit procedural fallback, with its use recorded in output metadata/recipe diagnostics.
10. **Export views:** compare actual downloaded files for Object, Flat and Image only. Flat has no directional lighting; Image only has no paper/gaps. Dimensions, alpha, orientation and colours follow the selected view.
11. **Regression:** old schema-1 recipes migrate with a visible version note and retain their intended B&W strength; do not claim pixel-identical output across renderer upgrades. Unknown newer schemas fail clearly.
12. **Performance:** include material maps, LUTs, highlight blur pyramids and grain in memory/latency measurements. No unmeasured guarantee of 60 fps or mobile 4K exports.

## 10. Priority and handoff

Build a genuine end-to-end renderer first, then improve measured fidelity. Release 1 includes the fourteen functional approximate profiles, dedicated B&W workflow, seven procedural materials, captured/hybrid map support, the three export views, and existing handmade layouts. Acquire/validate the small captured-material library as a separate visible quality gate within the release. Measured film calibration, RAW/HDR input, full spectral simulation, physical printer soft proofing, advanced paper meshes and local masks remain later work.

The controlling field names, ranges, defaults, migration and implementation order are in Sections 5, 7, 9, 10 and 14 of the main specification. The [updated Codex prompt](./CODEX_BUILD_PROMPT.md) directs the implementation to read both documents. This research adds material/film requirements; it does not remove the original artist analysis, layout integrity, source-preservation, privacy or export requirements.
