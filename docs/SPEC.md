# del - Companion App — Product Spec

> **Designer**: Sahar Shams
> **Platform**: iOS + Android (Client) · Web (Coach Dashboard)
> **URL**: del.saharshams.com

---

## Overview

**del** is a therapeutic coaching companion app. It connects a somatic/body-oriented coach (Sahar) with her clients between weekly sessions. Two interfaces:

1. **Client Mobile App** (iOS + Android) — 3 tabs
2. **Coach Dashboard** (Web) — desktop browser

---

## Program Model

The coaching relationship is a **12-session program over 3 months** (~1 session/week). The app supports the space *between* sessions:

- **Weekly practice** assigned by coach after each session
- **Daily check-ins** from the client (text or voice note)
- **Async messaging** (text + voice notes) between coach and client
- **Journey Map** — coach-written narrative after each session, building a story of the client's growth

---

## Design System

### Color Palette

| Token         | Hex       | Usage                                 |
| ------------- | --------- | ------------------------------------- |
| `cream`       | `#F7F2EA` | Primary background (light screens)    |
| `cream-dark`  | `#EDE5D8` | Card backgrounds, input fields        |
| `cream-mid`   | `#E2D8C8` | Borders, inactive streak days         |
| `brown`       | `#2A1A0E` | Headers, dark cards, primary text     |
| `brown-mid`   | `#6B4C38` | Secondary text, avatar gradients      |
| `brown-light` | `#9A7560` | Tertiary text, timestamps             |
| `gold`        | `#B8924A` | Accents, CTAs, active states          |
| `gold-light`  | `#D4B07A` | Greeting text, subtle accents         |
| `page-bg`     | `#1C1410` | Outer/dark background                 |

### Typography

| Font                      | Role                               | Weights              |
| ------------------------- | ---------------------------------- | -------------------- |
| **Cormorant Garamond**    | Display headings, names, titles    | 300, 400, 500 + italic |
| **Jost**                  | Body text, labels, buttons, UI     | 200, 300, 400        |

- Labels: ALL-CAPS, letter-spacing 0.2–0.4em
- Aesthetic: warm, intimate, editorial — not clinical

---

## Client Mobile App

### Tab 1: Home / Daily Practice

**Header** (dark brown):
- Greeting: "Good morning, [Name]"
- Date + week: "Thursday · Week 4 of 12"

**Weekly Streak Row** (M T W T F S S):
- States: **done** (gold), **today** (dark brown + gold text), **upcoming** (cream)
- Tracks daily practice completion

**This Week's Practice Card** (dark, gold top-border):
- Tag: "This week's practice"
- Title (serif): e.g., "Three breaths before you open your eyes"
- Description: Coach-written instruction
- CTA: "Mark as done" (gold pill button)

**Daily Check-in Card** (cream):
- Title: "Daily check-in"
- Prompt: "What is present in you today?"
- Input: text area (placeholder: "Write, or record a voice note...")
- Actions: "Voice Note" (outlined) + "Send to Sahar" (filled dark)

---

### Tab 2: Messages / Voice & Video

**Header** (dark brown):
- Coach avatar (initial circle, gradient)
- Coach name: "Sahar"
- Status: "Responds within 24 hours"

**Message Thread**:
- Date separators ("Tuesday", "Today")
- Coach messages: dark bubbles, left-aligned
- Client messages: cream bubbles, right-aligned
- Voice notes: gold play button + waveform bars + duration
- Timestamps on every message

**Input Area**:
- Text field: "Write a message..."
- Microphone button (gold icon) for voice recording

---

### Tab 3: Journey Map / Her Story

**Header** (dark brown):
- Title: "Your journey"
- Subtitle: "Written by Sahar after each session"

**Progress Section**:
- Label: "Month X of 3 · Week Y"
- Progress bar (gold fill)
- Counter: "N of 12 sessions complete"

**Journey Entries** (scrollable, white cards, gold left border):
- Week label: "Week 4 · This week"
- Title (italic serif): "The protector who never rests"
- Narrative body: Coach's reflective session summary (2nd person)
- Date: "Thursday, April 3"

---

### Bottom Navigation

| Icon          | Label        | Screen              |
| ------------- | ------------ | ------------------- |
| House         | **Home**     | Daily practice      |
| Circle-check  | **Messages** | Chat with coach     |
| Headphones    | **Journey**  | Session narratives  |

Active: gold icon + gold label. Inactive: white @ 30% opacity.

---

## Coach Web Dashboard

URL: `del.saharshams.com/dashboard`

### Sidebar (dark brown, ~220px)

- Logo: "del" (italic serif) + "Coach dashboard"
- **Client List** ("Your clients"):
  - Avatar (initial, gradient)
  - Name
  - Status: "Week X · Month Y"
  - Notification badge (gold, unread count)
  - Active item: subtle gold tint

### Main Panel (cream)

**Top Bar** (white):
- Client name + week: "Layla — Week 4 of 12 · Session tomorrow"
- CTA: "+ Post weekly practice" (gold pill)

**Content Grid** (2 columns):

1. **This Week's Check-ins**: Daily entries (day name + text or "Voice note · 0:42")
2. **Current Weekly Practice**: Dark card with week label, title, description
3. **Journey Map / Session Notes** (full width): Week/date, title, narrative, "Edit note" action

---

## Data Entities

| Entity              | Created By | Visible To              | Cadence                    |
| ------------------- | ---------- | ----------------------- | -------------------------- |
| **Weekly Practice**  | Coach      | Client + Coach          | 1x/week, after session     |
| **Daily Check-in**   | Client     | Client + Coach          | Daily (text or voice)      |
| **Message**          | Either     | Both                    | Async, anytime             |
| **Voice Note**       | Either     | Both                    | Within messages/check-ins  |
| **Journey Entry**    | Coach      | Client (read) + Coach (edit) | After each session    |
| **Streak**           | System     | Client                  | Auto-tracked               |

---

## Feature Matrix

| Feature                        | Client App | Coach Dashboard |
| ------------------------------ | ---------- | --------------- |
| View weekly practice           | Yes        | Yes             |
| Mark practice as done          | Yes        | —               |
| Submit daily check-in          | Yes        | —               |
| View client check-ins          | —          | Yes             |
| Send/receive messages          | Yes        | Yes             |
| Send/receive voice notes       | Yes        | Yes             |
| Read journey map               | Yes (read) | Yes             |
| Write/edit journey entries     | —          | Yes             |
| Post weekly practice           | —          | Yes             |
| Weekly streak tracker          | Yes        | —               |
| Program progress bar           | Yes        | —               |
| Client list + badges           | —          | Yes             |
| Push notifications             | Yes        | —               |

---

## Tone

This is not a clinical app. The language is **intimate and poetic**. Practices are invitations, not assignments. The check-in asks "What is present in you today?" The journey map reads like a letter. The aesthetic is warm earth tones — leather-bound journal, not healthcare SaaS.
