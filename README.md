# anycaller

_Working title — final brand TBD._

AI-driven outbound calling platform. Upload contacts, describe the goal of the call, run hundreds of AI-handled phone conversations in parallel, get back transcripts + structured outcomes.

## Repo layout

```
anycaller/
├── PRD.md                         ← Product Requirements Document (start here)
├── README.md                      ← This file
└── designs/                       ← Interactive HTML mockups
    ├── styles.css                 ← Shared design system
    ├── index.html                 ← Dashboard
    ├── contacts.html              ← Contact list + CSV import
    ├── campaign-builder.html      ← New campaign wizard (script step)
    ├── campaign-monitor.html      ← Live campaign view
    └── call-detail.html           ← Single call transcript + outcome
```

## View the designs

Open `designs/index.html` in a browser. A floating prototype nav at the bottom lets you jump between all five screens. Internet connection needed for the Inter web font + Lucide icons (CDN).

## Status

- ✅ Concept + PRD drafted
- ✅ Visual designs (HTML mockups) for 5 key screens
- ⬜ Tech spike on voice-AI provider (OpenAI Realtime vs. Retell vs. Vapi)
- ⬜ Twilio account + numbers
- ⬜ Implementation (estimated 6–8 weeks for MVP)
