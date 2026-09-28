---
title: "Mermaid Diagram Playground"
slug: "mermaid-playground"
published: 2026-09-28
draft: true
tags: ["system-design", "mermaid"]
description: "Draft examples for checking the shared Mermaid theme, semantic node styles, and diagram layout."
category: System Design
---

## Shared Styles

This draft is a local test page for the site's Mermaid theme. Change the shared theme in `src/plugins/mermaid-theme.mjs` to update all diagrams.

| Class | Meaning | Appearance |
| --- | --- | --- |
| `process` (also the default) | A service or processing step | Pale blue |
| `decision` | A branching condition | Pale amber |
| `storage` | A queue, cache, or persistent store | Pale teal |
| `terminal` | An entry point or stopped path | Slate with a dashed border |

Assign a class with `A[Process]:::process` or `class A,B process;`. The Markdown renderer inserts the shared `classDef` declarations into flowcharts automatically. Shapes and labels carry the meaning as well as color. Other diagram types use the shared base theme without flowchart classes.

## Workflow

Check that the main path reads top to bottom, decision edges have labels, and the rejected path stays short. “Validate” deliberately has no class to test the default style.

```mermaid
flowchart TD
    accTitle: Request validation workflow
    accDescr: An incoming request is validated. Valid requests are processed and saved; invalid requests are rejected.
    request([Request]):::terminal --> validate[Validate]
    validate --> valid{Valid?}:::decision
    valid -- Yes --> process[Process]:::process
    valid -- No --> reject[Reject]:::terminal
    process --> save[(Save result)]:::storage
```

## Architecture

A left-to-right layout fits this request/data flow. Check that services, caches, and persistent storage remain distinct without decorative styling.

```mermaid
flowchart LR
    accTitle: API with cache and database
    accDescr: A client sends requests through a load balancer to an API. The API reads a cache and accesses a database.
    client[Client]:::process --> lb[Load balancer]:::process
    lb --> api[API]:::process
    api --> cache[(Cache)]:::storage
    api --> db[(Database)]:::storage
```

## Sequence

This checks that the shared theme also works for a different Mermaid syntax, without injecting flowchart-only `classDef` statements.

```mermaid
sequenceDiagram
    accTitle: Read a stored value
    accDescr: A client requests a value from the API, which reads the database and returns the result.
    participant Client
    participant API
    participant DB as Database
    Client->>API: Get value
    API->>DB: Read key
    DB-->>API: Value
    API-->>Client: Response
```

## Visual Checks

- Labels and arrowheads remain readable on desktop and narrow screens.
- Diagrams retain their light canvas when the site switches to dark mode.
- Small diagrams stay at their natural size instead of stretching to fill the page.
- All three diagrams render after navigating away and back.
- This draft is excluded from production routes and search results.
