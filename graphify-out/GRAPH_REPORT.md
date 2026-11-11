# Graph Report - Guidify  (2026-11-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 29 nodes · 41 edges · 7 communities (4 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ef61c8e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Lighting and Layers
- Logo Flight Animation
- Procedural Logo Concepts
- Shared Scene Utilities
- Homepage Scene Setup
- Logo Geometry

## God Nodes (most connected - your core abstractions)
1. `studioLights()` - 5 edges
2. `shadowFloor()` - 4 edges
3. `buildLayers()` - 3 edges
4. `startFlight()` - 3 edges
5. `clamp()` - 2 edges
6. `ease()` - 2 edges
7. `ease()` - 2 edges
8. `lerp()` - 2 edges
9. `mount()` - 2 edges
10. `variants` - 2 edges

## Surprising Connections (you probably didn't know these)
- `buildLayers()` --calls--> `shadowFloor()`  [EXTRACTED]
  assets/3d/hero-layers.js → assets/3d/common.js
- `buildLayers()` --calls--> `studioLights()`  [EXTRACTED]
  assets/3d/hero-layers.js → assets/3d/common.js

## Import Cycles
- None detected.

## Communities (7 total, 3 thin omitted)

### Community 0 - "Lighting and Layers"
Cohesion: 0.47
Nodes (5): shadowFloor(), studioLights(), buildLayers(), extrude, tones

### Community 1 - "Logo Flight Animation"
Cohesion: 0.47
Nodes (4): clamp(), ease(), reduce, startFlight()

### Community 3 - "Shared Scene Utilities"
Cohesion: 0.50
Nodes (3): ease(), lerp(), reduceMotion

### Community 4 - "Homepage Scene Setup"
Cohesion: 0.50
Nodes (3): mount(), el, variants

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `studioLights()` connect `Lighting and Layers` to `Procedural Logo Concepts`, `Shared Scene Utilities`, `Logo Geometry`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `shadowFloor()` connect `Lighting and Layers` to `Shared Scene Utilities`, `Logo Geometry`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._