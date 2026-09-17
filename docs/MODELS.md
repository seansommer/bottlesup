# Editable 3D assets

`assets/models` contains nine GLB files:

| File | Contents |
| --- | --- |
| `bottle-1.glb` | Mighty Dozen bottle |
| `bottle-2.glb` | Celery + Lemon bottle |
| `bottle-3.glb` | Citrus Pineapple bottle |
| `bottle-4.glb` | Berry Lemon bottle |
| `crew-1.glb` … `crew-4.glb` | Four distinct simplified workers |
| `juice-bin.glb` | Large juice bin |

These are real mesh assets with PBR materials, exported from `src/models.js`. Geometry uses Y up and approximately meter-based scene units. Bottle base is at the origin, upright along +Y. Named objects include `JuiceBody`, `BottleCap`, `BrandLabel`, and crew `ArmLeft` / `ArmRight`.

The runtime loads the good bottle GLBs, applies a generated SUJA label texture, and uses the same procedural model factory for defect variants, helpers, and scenery. This makes the game resilient while GLBs load. Standalone exported labels are colored surfaces; the text texture is applied by the game. Workers are grouped meshes with pivoted arms, not skinned or motion-captured characters.

To regenerate after editing the mesh source:

```sh
npm ci
npm run models
npm run build
```

In Blender, use File → Import → glTF 2.0. In Unreal, import through the available glTF/Interchange importer. Check scale, materials, forward direction, and collision after import. Export a replacement with the same upright pivot and `BrandLabel` name if it will be swapped into this browser game. Test on a real phone before raising polygon or texture budgets.

The supplied source can also generate additional juice/crew variations. The user-uploaded workplace photos are references and are not included in the public repository.
