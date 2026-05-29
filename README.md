# Go-To-Market Content Pipeline Generator for Canva

A lightweight AI content pipeline that transforms a structured library of startup and side-hustle ideas into Canva-ready marketing assets using randomized selection logic, Gemini-powered generation, and structured output mapping.

## Problem

Manually converting a large library of business ideas into format-specific content was slow, inconsistent, and difficult to scale. Each content series required manual idea selection, copy generation, and formatting before assets could move into design production. This pipeline automates those steps so a single structured content library can power repeatable, high-volume go-to-market output.

## What it does

This system reads records from a centralized content library, selects inputs based on content-type logic, constructs prompts for Gemini, parses structured JSON responses, and writes template-ready outputs for Canva Bulk Create workflows.

The production workflow was built on an internal library of 1,400+ ideas and designed to generate up to 28 content assets across multiple formats in a monthly content cycle. This public repository contains a sanitized, portfolio-safe version of the codebase plus a small sample dataset.

## Key features

- Randomized selection of ideas from a master content library to reduce repetition
- Separate generation workflows for distinct content formats
- Gemini-powered content generation with format-aware prompts
- Structured JSON parsing into reusable output fields
- Canva Bulk Create-ready schema mapping
- Rolling history logs to track prior generations and reuse strong variants
- Shared configuration and helper modules for maintainability

## Workflow


[Core Database Layer] ──(Embedded Engine)──> [Dynamic Payload Generation]
│
[Downstream Assets] <──(JSON Array Parser)── [Gemini 2.5 Flash API]
│
└──> [Rolling History Log] ──> [Vector Layout Pipeline]



1. Read idea records from the centralized content library.
2. Apply randomized selection logic across themes, formats, or variations.
3. Build structured prompts from each selected record.
4. Send prompts to Gemini for content generation.
5. Parse JSON responses into reusable content fields.
6. Write results into publishing-ready output layouts.
7. Map output columns into Canva Bulk Create templates for large-scale content production.

High-level flow:

- Centralized content library → content-type selection → prompt construction
- Prompt → Gemini 2.5 Flash → JSON response → parser
- Parsed fields → Canva-ready output layout → Bulk Create templates
- All generations mirrored into rolling history logs for monitoring and reuse

## Architecture

- **Centralized content library** – Source-of-truth idea repository
- **Orchestration layer** – Reads inputs, builds prompts, calls the model, parses responses, and writes outputs
- **Gemini API** – Content generation layer
- **Structured output schema** – Downstream Canva and publishing handoff
- **History logs** – Traceability and iterative reuse

The codebase is organized around modular workflow components:

- `config.gs` – Environment-based configuration
- `helpers.gs` – Shared utilities
- `POVView.gs` – Generator for POV-style hooks and captions
- `generateSevenRandomHustles.gs` – This-or-that poll generator and captions
- `DidYouKnowFactoid.gs` – Data-backed factoid post generator
- `SidehustleIdeaOfTheDay.gs` – Daily spotlight post generator and archive

## Example output types

The pipeline is designed to generate structured fields that support multiple content formats, such as:

- POV hooks and secondary punchlines for short-form video
- “Did you know?” factoid hooks with data-backed body copy
- “This or That” side-hustle comparison captions for polls
- “Side Hustle of the Day” spotlight posts across a weekly calendar
- Canva-ready text fields for template mapping

Each generator writes into a consistent output layout so the same design templates can be reused month over month.

## Use case

This system was designed for startup and entrepreneurial go-to-market teams that want to turn a structured content library into repeatable, scalable marketing assets.

Rather than manually drafting every asset, an operator can trigger the pipeline, review generated outputs, and move approved content into Canva for design production. This makes it easier to scale content creation while preserving structure, speed, and reuse across formats.

## Repo structure

- `sample-data/` – Small redacted demo dataset
- `docs/screenshots/` – Screenshots and workflow visuals
- `config.gs` – Environment configuration
- `helpers.gs` – Shared utility functions
- `POVView.gs` – POV video layout generator and history logger
- `generateSevenRandomHustles.gs` – This-or-that generator
- `DidYouKnowFactoid.gs` – Factoid generator and history logger
- `SidehustleIdeaOfTheDay.gs` – Daily spotlight generator and history logger
- `appsscript.json` – Project manifest

## Setup

Install `clasp`:

```bash
npm install -g @google/clasp
clasp login
```

Set the required project properties:

- `GEMINI_API_KEY_CANVA_POV`
- `GEMINI_API_KEY_DAILY_IDEA`
- `GEMINI_API_KEY_FACTOID_SERIES`
- `GEMINI_API_KEY_HUSTLES`
- `SOURCE_DATA_ID`
- `INPUT_TAB_NAME`
- `OUTPUT_TAB_NAME`

Then sync the codebase to the project environment and connect it to the centralized content library used for generation.

## Public repo notes

This repository is a sanitized public version of a larger internal workflow:

- No production API keys are included
- No proprietary source datasets are included
- Canva templates used in production are excluded
- Sample data is illustrative only and significantly reduced versus the production dataset

## Future improvements

- Stronger schema validation and retry handling around model outputs
- More granular logging by content type
- Additional generator modules for new formats
- Direct publishing integrations beyond Canva
- Configurable weighting for idea selection by category or theme