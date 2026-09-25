# Toran

Digital heritage archive and institutional twin for the Dr. Ambedkar National Memorial,
26 Alipur Road, Delhi.

A navigable reconstruction of the memorial in which every screen in the building is a live
application, backed by an archive that links Dr. Ambedkar's writings to the Constituent
Assembly Debates to the ratified Articles of the Constitution, with page-level citations
on every link.

The visit begins above Alipur Road and flies in: through the gate, past the Ashoka pillar,
up the steps and through the arch of the open-book building to the statue in the atrium.
Inside, the exhibit sections stand along the walls — the backlit archive photographs, the
recreated study, the manuscript cases, the banyan tableau — and a kiosk stands in front of
each one.

Built for Smart India Hackathon 2026, problem statement SIH26096, Ministry of Social
Justice and Empowerment.

## What it does

- Semantic and keyword search across the writings and the Assembly debates, running on the
  device with no network required
- A provenance graph tracing each Article back through debate to its source text
- Deep zoom into scanned manuscripts with OCR transcription and visible confidence
- Narration and translation across the 22 scheduled languages
- An interactive timeline and the photographic collection
- A research assistant that cites every claim and declines when the corpus does not support
  an answer
- Curation tools for ingest, metadata, OCR correction and kiosk fleet management

## Standards

Archival packaging follows OAIS (ISO 14721). Description uses Dublin Core, preservation
events use PREMIS, and scanned material is published as IIIF Presentation manifests so it
can be read in any IIIF viewer.

## The twin

The campus and the building are modelled separately and culled against each other at the
plane of the entrance arch, so only one half is ever drawn. Everything is procedural: the
geometry is built from primitives and merged by material, the textures are drawn on a 2D
canvas at load, and nothing is fetched over the network — the kiosk boots offline on a
Raspberry Pi.

`npm run verify:campus` checks the fifty-two relationships the site plan has to satisfy
without needing a browser. `npm run verify:twin` runs the shipped build in Chrome and
measures it.

## Status

In development.

## Stack

Next.js and TypeScript, React Three Fiber for the twin, on-device embeddings via
transformers.js, Bhashini for Indic language services, static export to Chromium kiosk mode
on Raspberry Pi.
