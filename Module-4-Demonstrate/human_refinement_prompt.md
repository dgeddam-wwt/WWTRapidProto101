#Human Refinement Prompt

**Attach:** Selected output definition

---

This is the concept we picked. It's the right idea but it's not buildable yet — it describes intent, not behavior. Refine it with the following, then write me an as-built build plan Devin could implement from that one file with no other context.

**Dial back the compliance claims.** It reads like the tool decides whether something violates HIPAA. It doesn't. It surfaces possible identifier exposure and helps staff write a safer draft for a human to review. Every finding should be phrased as a *potential* identifier requiring review, never a ruling. Bake that into the UI copy, not just a footnote.

**Lock the build.** React + Vite, Tailwind, lucide-react, single page, fully client-side, no backend or API keys. All detection is deterministic local regex and heuristics — no LLM, no model. Say that plainly so Devin doesn't reach for an API and so nobody in the demo thinks we trained something.

**Cover all 18 Safe Harbor categories, and show the coverage.** Six example findings won't survive a compliance officer — the first question is "what about the rest?" Scan all 18, and be honest about which are regex-detectable, which are heuristic, and which can't be found in plain text at all (biometrics, photos — show those as manual-check items so coverage reads 18 of 18). Clinical specialty and things like "medication list" should be flagged but clearly labeled as sensitive context, not one of the 18.

**Give it a number.** Right now findings have no weight, so there's nothing to show leadership and nothing a reviewer can push back on. Assign severity per finding, sum it into a risk score, map the score to a tier, and show the number in the UI so the tier is explainable instead of opaque. A direct record or contact identifier should be able to force the top tier on its own. Tune the thresholds so a full name plus an appointment date lands mid-tier, not critical — that combination is common and shouldn't max out the meter.

**Add nuance or the demo dies.** If it screams CRITICAL at the clinic's own callback number, we lose the room. A first name alone is weak — surface it, don't score it. A full name is meaningful. Phone numbers and email addresses need to be judged by surrounding context: "call our office at…" is operational contact info and should go to manual review, "John's cell is…" is the patient's and should be direct. When context is unclear, default to manual review, not critical.

**Kill the bracket placeholders.** `Hello [PATIENT NAME]` format is not required in an email or a text message. Instead, classify what the message is *for* — confirmation, reminder, follow-up, reschedule, pre-visit prep, billing, general — and regenerate a clean portal-directed message that keeps the intent. Show the detected purpose and let the user override it, so human oversight is visible on screen.

**Then make it demo-able and implementable.** Spec the three panels and the header, wire test-scenario buttons that auto-scan, add a collapsible reference of the 18 categories, and specify the visual direction — clean, healthcare-appropriate, no futuristic AI styling. Include three worked sample scenarios (high risk, mid risk, safe) with their inputs, findings, scores, tiers, and expected output so Devin can verify the math. Name the components, file structure, and state. Write acceptance criteria that pin the name/phone/email edge cases explicitly. And list the known gaps.

Clarity over sophistication throughout. A stakeholder has to understand the whole workflow in 30 seconds, and the disclaimer and human-review requirement stay visible the entire time.
