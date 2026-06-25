# Deadline Guardian AI — Project Description

## Problem Statement Selected

**The Last-Minute Life Saver** — Students, professionals, and entrepreneurs frequently miss deadlines, assignments, meetings, and important commitments because traditional productivity tools rely on passive reminders that are easy to ignore and do little to help users actually complete their work.

## Solution Overview

Deadline Guardian AI is a productivity companion that treats a user's commitments as an interconnected portfolio rather than a flat to-do list. Instead of issuing isolated reminders, it uses Gemini to reason across all of a user's active tasks at once — surfacing workload collisions, competing deadlines, and the single commitment most likely to derail the user's week — and turns that analysis into concrete next actions: broken-down subtasks, a re-prioritized task list, and an hour-by-hour daily schedule.

The goal is to move users from "I have a deadline coming up" to "here is exactly what to do in the next 30 minutes," which is the core gap the challenge brief identifies in passive reminder tools.

## Key Features

- **AI Subtask Generation** — Given a task title, description, category, and target hours, Gemini breaks the task into 3–7 atomic, actionable subtasks with time estimates, so a vague goal becomes a concrete checklist.
- **Portfolio-Level Risk Analysis** — Rather than scoring deadline risk in isolation, the app sends a task's full context alongside every other active commitment, so Gemini can flag workload collisions and explain *why* a deadline is risky relative to everything else competing for the user's time.
- **Intelligent Task Prioritization** — Gemini reviews the entire task list together and recommends priority levels (including a reserved "guardian-priority" tier for the single highest-risk commitment), with a short reasoning explanation attached to each recommendation.
- **AI-Generated Daily Action Plan** — A full chronological schedule from wake time to bedtime, built around the user's available focus hours and existing commitments, with a summary, a focus message, and tactical mitigation tips for the day.
- **Context-Aware Motivational Coaching** — A dynamic coaching panel that adapts its tone to the user's environment: blunt, high-accountability messaging in Dark/high-pressure mode, and warm, encouraging messaging in Light mode — driven by the user's current risk profile and productivity score.
- **Immersive Focus Room** — A distraction-free workspace with a custom procedural ambient audio engine (built directly with the Web Audio API, not pre-recorded files), a toggleable 12h/24h clock, and true browser fullscreen mode for deep work sessions.
- **Daily Defensive Shield Habits** — A dedicated tracker for pro-active habits (Work, Study, Personal, Health, Other) designed to systematically build routine consistency.
- **Secure Cloud Sync & Google Calendar Integration** — Seamlessly connect with Google to secure and back up your tasks and habits securely into Google Firebase Firestore, and sync scheduled commitments directly to Google Calendar as active timeline events.
- **Resilient AI Layer** — All Gemini calls run through a retry-and-fallback wrapper (primary model with automatic fallback to a lighter model on failure), so the app degrades gracefully instead of breaking under rate limits or transient errors.

## Technologies Used

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion (animation)
- **Backend:** Node.js, Express
- **State & Persistence:** React hooks, Google Firebase Firestore, and browser localStorage
- **Audio:** Custom procedural audio engine built on the Web Audio API
- **Build/Tooling:** esbuild, tsx

## Google Technologies Utilized

- **Gemini API** (`@google/genai`) — powers all five AI endpoints: subtask generation, deadline risk scoring, task prioritization, daily action plan generation, and motivational coaching. Uses Gemini's structured output (`responseSchema`) feature to return strict, type-safe JSON consumed directly by the frontend.
- **Gemini Models:** `gemini-3.5-flash` as the primary reasoning model, with automatic fallback to `gemini-3.1-flash-lite` for resilience under load.
- **Google Firebase (Auth & Firestore)** — Powers Google OAuth secure authentication and real-time user backups/restorations of commitments, checklists, and habits.
- **Google Calendar API** — Integrates with the user's calendar to register commitments directly as actionable time blocks.
- **Google AI Studio** — used for development, secrets management (API keys), and deployment.
- **Google Cloud Run** — hosting target for the deployed application via AI Studio's deploy pipeline.
