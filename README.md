# Go-To-Market Content Pipeline Generator for Canva

A Google Apps Script-based content automation pipeline that transforms structured startup content ideas into reusable social media content variants for Canva Bulk Create workflows.

## What it does

This project reads rows of content ideas from Google Sheets and generates structured social media outputs using a combination of randomized formatting logic, Google Sheets-based inputs, and Gemini-powered text generation.

The workflow is designed to support repeatable go-to-market content production. Generated outputs are written into a structured sheet format that can be mapped directly into Canva templates for fast, large-scale content creation.

The production version was built on an internal library of 1,400+ ideas and designed to generate up to 28 pieces of content across multiple formats in a monthly content cycle. This public repository contains a sanitized, portfolio-safe version of the codebase plus a small sample dataset.

## Workflow

1. Read idea records from a Google Sheet.
2. Apply randomized selection logic across content themes, formats, or variations.
3. Build structured prompts from each row.
4. Send prompts to Gemini for content generation.
5. Parse the responses into reusable content fields.
6. Write results back to an output sheet organized for downstream publishing.
7. Map output columns into Canva Bulk Create templates for large-scale content production.

**Flow:** Google Sheets -> Apps Script -> Gemini -> Structured output sheet -> Canva Bulk Create -> Scheduled Content Posts

[Google Sheet DB] ──(clasp/Apps Script)──> [Dynamic Prompts]
                                                 │
 [Canva Layouts] <──(JSON Array Parser)── [Gemini 2.5 Flash]
        │
        └──> [Rolling History_Log] ──> [Canva Bulk Create Pipeline]

## Example outputs

The pipeline is designed to generate structured fields that support multiple content formats, such as:

- Hooks
- Captions
- Calls to action
- Themed content variants
- Day-by-day or post-by-post output structures
- Canva-ready text fields for template mapping

## Architecture

- **Google Sheets** = source-of-truth data layer
- **Apps Script** = orchestration and transformation layer
- **Gemini API** = content generation layer
- **Structured output schema** = downstream Canva and publishing inputs

## Use case

This system was designed as part of a broader go-to-market content workflow for startups and entrepreneurial brands that want to turn a structured content idea library into repeatable, scalable social media assets.

Rather than manually writing and formatting every post, the pipeline automates idea selection, variation generation, text generation, and output structuring so that final design production can be completed quickly inside Canva.

## Repo structure

- `sample-data/` small redacted demo dataset
- `docs/screenshots/` screenshots for repo documentation
- `*.gs` Apps Script source files
- `appsscript.json` Apps Script manifest

## Setup

Install `clasp`:

```bash
npm install @google/clasp -g
clasp login
```

Set these Script Properties in Apps Script Project Settings:

- `GEMINI_API_KEY`
- `SOURCE_SHEET_ID`
- `INPUT_SHEET_NAME`
- `OUTPUT_SHEET_NAME`

Then push local changes with:

```bash
clasp push
```

## Local Testing Infrastructure

Because Google Apps Script constraints isolate execution to Google's Cloud sandbox (leaving native APIs like `SpreadsheetApp`, `UrlFetchApp`, and `PropertiesService` unavailable globally in standard Node.js), a local mocking engine was engineered to support headless unit testing.

The project uses **Jest** alongside an explicit global interceptor (`mocks.js`) to decouple business algorithms from live workspace integrations. This enables immediate testing of configuration validation, dynamic layout generation, and deep matching logic on an absolute local scope.

### Running Unit Tests Locally

Ensure development dependencies are initialized:
```bash
npm install

npm test

## Canva integration

Generated output fields are designed to map directly to Canva Bulk Create text and media elements.

This public repository does not include proprietary production Canva templates, but the workflow is structured so that output columns can be connected directly to prebuilt template elements inside Canva.

## Notes

- This is a sanitized public portfolio version of a larger internal workflow.
- No production API keys, live sheet IDs, or proprietary datasets are included.
- Sample data is illustrative only.
- Proprietary Canva templates are not included in this repository.
