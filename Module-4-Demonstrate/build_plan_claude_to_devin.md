# Build Plan: Claude to Devin


# Part 1: Final Prototype Definition Given to Claude

## Prompt to Claude

You are my thinking partner for a rapid prototyping engagement.

We have selected one prototype concept to move forward with: HIPAA Shield Agent.

I need you to turn the final concept definition into a structured build plan that Devin can use to create a browser-based rapid prototype.

This should not be a production healthcare application.

This should be a lightweight working prototype that helps stakeholders understand the workflow and react to the idea.

---

## Customer Context

Kenstrel Health Alliance is a rapidly growing regional medical group with 8 clinics sending more than 1,500 patient communications each week.

Administrative staff manually write appointment confirmations, follow-ups, clinic reminders, scheduling updates, and pre-visit instructions.

Because these messages may contain Protected Health Information, staff are heavily self-auditing their communications before sending them. This creates operational friction and slows down routine work.

Leadership wants to explore whether a lightweight compliance-assist workflow could help staff identify potential PHI risks before messages are sent.

---

## Selected Concept

HIPAA Shield Agent

---

## Concept Summary

HIPAA Shield Agent is a lightweight compliance assistant that scans patient communications, identifies potential HIPAA Safe Harbor risks, and generates a safer version for human review before the message is sent.

The experience should be simple enough for a non-technical administrative user to understand quickly.

The prototype should demonstrate:

1. Input Draft
2. Instant Evaluation
3. One-Click Copy

---

## Target User

Healthcare administrative staff responsible for routine patient communications.

Examples:

- Scheduling coordinators
- Clinic administrators
- Patient support staff
- Back-office administrative teams

---

## Business Question

Can a lightweight compliance-assist workflow reduce administrative review effort, increase employee confidence, and lower the risk of PHI exposure without requiring a major email platform replacement, EHR integration, or secure messaging implementation?

---

## Desired Prototype Workflow

### Step 1: Input Draft

The user pastes or writes a patient communication into the HIPAA Shield workspace.

The input should feel familiar and low-friction.

The user should not need to log in, connect a system, or configure anything.

---

### Step 2: Instant Evaluation

The prototype scans the draft and flags potential PHI indicators.

The findings should be easy to understand.

Each finding should include:

- The detected value
- The type of identifier
- A short explanation of why it may be risky

---

### Step 3: One-Click Copy

The prototype generates a safer version of the communication.

Potentially sensitive content should be replaced with placeholders.

Example placeholders:

- [PATIENT NAME]
- [DATE]
- [CLINICAL CONTEXT]
- [PHONE NUMBER]
- [EMAIL ADDRESS]
- [IDENTIFIER]

The user should be able to copy the safer version with one click.

---

## Prototype Requirements

Build a single-page browser prototype.

The prototype should include:

1. A title area with the name "HIPAA Shield Agent"
2. A short subtitle explaining the purpose
3. A left panel for the input draft
4. A middle panel for risk findings
5. A right panel for sanitized output
6. A sample scenario button
7. A clear/reset button
8. A copy button for the sanitized output
9. A simple status indicator showing whether risk was detected
10. Short helper text that reminds users this is a prototype and human review is required

---

## Required Detection Logic

Use simple deterministic rules for prototype purposes.

The tool should detect examples of the 18 HIPAA Safe Harbor identifiers listed below.

The prototype does not need to perfectly solve PHI detection.

The goal is to show the concept and demonstrate how a compliance-assist workflow could work.

---

## The 18 HIPAA Safe Harbor Identifiers to Include

Use the following identifier categories as the reference list for the prototype:

1. Names
2. Geographic subdivisions smaller than a state, including street address, city, county, precinct, ZIP code, and equivalent geocodes
3. All elements of dates except year for dates directly related to an individual, including birth date, admission date, discharge date, date of death, and ages over 89
4. Telephone numbers
5. Fax numbers
6. Email addresses
7. Social Security numbers
8. Medical record numbers
9. Health plan beneficiary numbers
10. Account numbers
11. Certificate or license numbers
12. Vehicle identifiers and serial numbers, including license plate numbers
13. Device identifiers and serial numbers
14. Web URLs
15. IP address numbers
16. Biometric identifiers, including finger and voice prints
17. Full-face photographic images and comparable images
18. Any other unique identifying number, characteristic, or code

---

## Prototype Detection Scope

For the v1 prototype, prioritize detecting the identifiers most likely to appear in routine patient communications:

High-priority detection:

- Names
- Dates
- Phone numbers
- Email addresses
- Street addresses
- ZIP codes
- Medical record numbers
- Account numbers
- Clinical context terms when linked to a person or appointment

Medium-priority detection:

- Social Security number patterns
- License or certificate number patterns
- URLs
- IP addresses
- Health plan beneficiary number patterns

Low-priority / educational-only detection:

- Biometric identifiers
- Full-face photographs
- Device identifiers
- Vehicle identifiers

For low-priority categories that are difficult to detect in plain text, include them in the reference panel or helper text rather than building complex detection.

---

## Sample Input for Prototype

Use this as the default test message:

Hi John Smith,

I'm reaching out to confirm your cardiology consultation with Dr. Evans on July 22, 2026.

Please remember to bring your current medication list.

If you need to reschedule, call us at 415-555-0199 or email careteam@kenstrel.example.

Your patient ID is MRN-884392.

---

## Expected Findings

The prototype should flag:

- John Smith
  - Category: Name
  - Reason: Names are one of the Safe Harbor identifiers.

- Cardiology consultation
  - Category: Clinical context
  - Reason: Clinical context connected to an individual may increase communication risk.

- Dr. Evans
  - Category: Provider reference / contextual health information
  - Reason: Provider references can add clinical context to the message.

- July 22, 2026
  - Category: Date
  - Reason: Dates directly related to an individual are Safe Harbor identifiers, except year.

- 415-555-0199
  - Category: Telephone number
  - Reason: Telephone numbers are one of the Safe Harbor identifiers.

- careteam@kenstrel.example
  - Category: Email address
  - Reason: Email addresses are one of the Safe Harbor identifiers.

- MRN-884392
  - Category: Medical record number
  - Reason: Medical record numbers are one of the Safe Harbor identifiers.

---

## Expected Sanitized Output

Hello [PATIENT NAME],

This is a reminder regarding your upcoming appointment.

Please review your patient portal for additional details or contact the clinic through an approved communication channel.

---

## Guardrails

The prototype must stay within these boundaries:

- Use synthetic data only
- Do not connect to email systems
- Do not send messages
- Do not connect to EHR systems
- Do not store patient information
- Do not use a cloud database
- Do not make external API calls
- Do not use real patient records
- Do not claim HIPAA compliance certification
- Do not make autonomous send/block decisions
- Always require human review before use

---

## Look and Feel

The prototype should feel:

- Clean
- Healthcare-appropriate
- Simple
- Professional
- Trustworthy
- Easy for administrative users to understand

Use a three-panel visual structure:

1. Blue / neutral panel for the input draft
2. Red / amber panel for detected risk findings
3. Green panel for sanitized output

Avoid:

- Overly futuristic AI styling
- Dark mode
- Dense dashboards
- Technical jargon
- Legalistic language
- Production-system claims

---

## Output Needed From Claude

Create a structured Devin build plan that includes:

1. Product objective
2. User story
3. Screen layout
4. Component list
5. Detection rules
6. Sanitization rules
7. Sample data
8. Interaction behavior
9. Acceptance criteria
10. Constraints and guardrails
11. Clear instructions for Devin

Make the plan specific enough that Devin can build the prototype without needing additional business context.

---

# Part 2: Claude Output — Build Plan for Devin

## Product Objective

Build a single-page browser prototype called HIPAA Shield Agent.

The prototype should demonstrate how administrative healthcare staff could paste a patient communication, instantly see potential HIPAA Safe Harbor risks, and copy a safer version for human review.

This prototype is intended for a rapid prototyping course and executive demonstration.

The goal is to make the workflow tangible, not to build a production compliance product.

---

## User Story

As a healthcare administrative staff member,

I want to paste a draft patient communication into a simple review tool,

So that I can immediately identify possible PHI risks,

And copy a safer version for human review before sending.

---

## Core Workflow

Input Draft
→ Instant Evaluation
→ One-Click Copy

---

## Screen Layout

Create a single-page application with three primary panels.

### Header

Include:

- Product name: HIPAA Shield Agent
- Subtitle: "Rapid prototype for reviewing patient communications before sending"
- Small disclaimer: "Prototype only. Synthetic data. Human review required."

---

## Panel 1: Input Draft

### Purpose

Allow the user to paste or write a patient communication.

### Components

- Large text area
- Button: "Load Sample Draft"
- Button: "Clear Draft"
- Helper text: "Paste a patient communication to scan for potential identifiers."

### Default State

Text area is empty.

When the user clicks "Load Sample Draft," populate the text area with the sample message.

---

## Panel 2: Instant Evaluation

### Purpose

Show detected potential PHI identifiers and explain why each was flagged.

### Components

- Risk status badge
- Findings count
- List of findings
- Identifier category for each finding
- Short explanation for each finding

### Risk Status Logic

If no identifiers are detected:

Display:

"Lower Risk Draft"

Use green styling.

If one or more identifiers are detected:

Display:

"Potential PHI Detected"

Use red or amber styling.

### Finding Card Format

Each finding should display:

- Detected text
- Identifier category
- Explanation
- Suggested replacement

Example:

Detected:
John Smith

Category:
Name

Why it matters:
Names are one of the HIPAA Safe Harbor identifiers.

Suggested replacement:
[PATIENT NAME]

---

## Panel 3: Sanitized Output

### Purpose

Show a safer version of the message with placeholders replacing detected identifiers.

### Components

- Sanitized output text area
- Button: "Copy Safe Draft"
- Copy confirmation message
- Reminder text: "Review before use. This prototype does not guarantee compliance."

### Output Behavior

When identifiers are detected, replace them with bracketed placeholders.

Examples:

John Smith → [PATIENT NAME]

July 22, 2026 → [DATE]

415-555-0199 → [PHONE NUMBER]

careteam@kenstrel.example → [EMAIL ADDRESS]

MRN-884392 → [MEDICAL RECORD NUMBER]

Cardiology consultation → [CLINICAL CONTEXT]

Dr. Evans → [PROVIDER REFERENCE]

---

# Detection Rules

Use deterministic pattern matching.

Do not use an external LLM API.

Do not make network calls.

All scanning should happen client-side.

---

## Identifier Reference List

The UI should include or reference the following 18 HIPAA Safe Harbor identifier categories:

1. Names
2. Geographic subdivisions smaller than a state
3. Dates directly related to an individual, except year
4. Telephone numbers
5. Fax numbers
6. Email addresses
7. Social Security numbers
8. Medical record numbers
9. Health plan beneficiary numbers
10. Account numbers
11. Certificate or license numbers
12. Vehicle identifiers and serial numbers
13. Device identifiers and serial numbers
14. URLs
15. IP addresses
16. Biometric identifiers
17. Full-face photographic images and comparable images
18. Any other unique identifying number, characteristic, or code

---

## Detection Implementation Guidance

For v1, implement simple regex or keyword-based detection.

### Names

Detect sample names from the synthetic scenario.

Examples:

- John Smith
- Nina Specter
- Audrey Miles
- Marcus Lee

Replacement:

[PATIENT NAME]

---

### Dates

Detect dates in common formats.

Examples:

- July 22, 2026
- 07/22/2026
- 08/12/2026
- next Tuesday

Replacement:

[DATE]

---

### Phone Numbers

Detect common phone number formats.

Examples:

- 415-555-0199
- (415) 555-0199
- 415.555.0199

Replacement:

[PHONE NUMBER]

---

### Email Addresses

Detect email address patterns.

Example:

- careteam@kenstrel.example

Replacement:

[EMAIL ADDRESS]

---

### Medical Record Numbers

Detect common mock MRN patterns.

Examples:

- MRN-884392
- MRN 884392
- Medical Record Number: 884392

Replacement:

[MEDICAL RECORD NUMBER]

---

### Addresses and Geographic Subdivisions

Detect simple mock address or location patterns.

Examples:

- 123 Market Street
- San Francisco
- 94105

Replacement:

[LOCATION]

---

### Social Security Numbers

Detect SSN-like patterns.

Example:

- 123-45-6789

Replacement:

[SOCIAL SECURITY NUMBER]

---

### Account Numbers

Detect simple account number patterns.

Examples:

- Account #44592
- Acct-44592

Replacement:

[ACCOUNT NUMBER]

---

### Health Plan Beneficiary Numbers

Detect simple mock beneficiary number patterns.

Examples:

- HPB-220194
- Beneficiary ID 220194

Replacement:

[HEALTH PLAN BENEFICIARY NUMBER]

---

### License or Certificate Numbers

Detect simple license number patterns.

Examples:

- License #CA-88291
- Cert-10028

Replacement:

[LICENSE NUMBER]

---

### URLs

Detect web URLs.

Examples:

- https://patient.example.org
- www.portal.example.org

Replacement:

[URL]

---

### IP Addresses

Detect IPv4-style strings.

Example:

- 192.168.1.10

Replacement:

[IP ADDRESS]

---

### Clinical Context Terms

Although clinical specialties are not listed as a standalone Safe Harbor identifier, include them in the prototype as contextual risk terms when they appear in patient communication.

Examples:

- cardiology
- oncology
- dental
- dermatology
- medication list
- consultation
- follow-up
- pre-visit instructions

Replacement:

[CLINICAL CONTEXT]

Explanation:

Clinical context can increase sensitivity when combined with an individual identifier.

---

## Sanitization Rules

When a finding is detected, replace it with the appropriate bracketed placeholder.

The sanitized draft should remain readable.

Do not overcomplicate the rewrite.

The goal is to show a safer communication pattern, not perfect language generation.

---

## Sample Scenario

### Sample Input

Hi John Smith,

I'm reaching out to confirm your cardiology consultation with Dr. Evans on July 22, 2026.

Please remember to bring your current medication list.

If you need to reschedule, call us at 415-555-0199 or email careteam@kenstrel.example.

Your patient ID is MRN-884392.

---

### Expected Sanitized Output

Hello [PATIENT NAME],

This is a reminder regarding your upcoming appointment.

Please review your patient portal for additional details or contact the clinic through an approved communication channel.

---

### Expected Findings

1. John Smith
   - Category: Name
   - Replacement: [PATIENT NAME]

2. Cardiology consultation
   - Category: Clinical context
   - Replacement: [CLINICAL CONTEXT]

3. Dr. Evans
   - Category: Provider reference
   - Replacement: [PROVIDER REFERENCE]

4. July 22, 2026
   - Category: Date
   - Replacement: [DATE]

5. Medication list
   - Category: Clinical context
   - Replacement: [CLINICAL CONTEXT]

6. 415-555-0199
   - Category: Telephone number
   - Replacement: [PHONE NUMBER]

7. careteam@kenstrel.example
   - Category: Email address
   - Replacement: [EMAIL ADDRESS]

8. MRN-884392
   - Category: Medical record number
   - Replacement: [MEDICAL RECORD NUMBER]

---

# Interaction Behavior

## Load Sample Draft

When the user clicks "Load Sample Draft":

- Populate the input panel
- Run the scan automatically
- Show findings
- Generate sanitized output

---

## Manual Input

When the user types or pastes a message:

- Run the scan automatically or provide a "Scan Draft" button
- Update findings
- Update sanitized output

For simplicity, either interaction is acceptable.

Preferred behavior:

Scan automatically when text changes.

---

## Clear Draft

When the user clicks "Clear Draft":

- Clear input draft
- Clear findings
- Clear sanitized output
- Reset status badge

---

## Copy Safe Draft

When the user clicks "Copy Safe Draft":

- Copy sanitized output to clipboard
- Display confirmation: "Safe draft copied for review"

---

# Visual Design

Use a clean healthcare-oriented design.

Recommended color system:

- Blue for input and general information
- Red or amber for risk findings
- Green for sanitized output
- White background
- Light gray section borders
- Rounded cards
- Clear typography

Avoid overly technical or futuristic AI visuals.

---

# Component List

Build the following components:

1. App Header
2. Disclaimer Banner
3. Input Draft Panel
4. Sample Draft Button
5. Clear Button
6. Risk Status Badge
7. Findings Panel
8. Finding Card
9. Sanitized Output Panel
10. Copy Button
11. Identifier Reference Section
12. Footer note: "Prototype only. Not a compliance guarantee."

---

# Identifier Reference Section

Include a collapsible or side reference section titled:

"18 Safe Harbor Identifier Categories"

Show the 18 categories in a concise list.

This helps learners and stakeholders understand what the prototype is checking against.

---

# Acceptance Criteria

The prototype is complete when:

1. The page loads successfully.
2. The user can load the sample draft.
3. The sample draft produces multiple findings.
4. Each finding has a category and explanation.
5. A sanitized output is generated.
6. The user can copy the sanitized output.
7. The UI clearly shows the three-step workflow:
   - Input Draft
   - Instant Evaluation
   - One-Click Copy
8. The prototype includes the 18 Safe Harbor identifier categories.
9. The prototype includes a visible disclaimer that it is not production-ready or compliance-approved.
10. A stakeholder can understand the workflow in under 30 seconds.

---

# Out of Scope

Do not build:

- Login
- Authentication
- Authorization
- User roles
- Email sending
- Outlook or Gmail integration
- EHR integration
- Patient portal connection
- Database storage
- Cloud storage
- Audit logs
- Reporting dashboards
- Legal compliance certification
- Real PHI handling
- External API calls
- LLM API calls

---

# Human Review Requirement

Make it clear in the UI that the sanitized output must be reviewed by a human before use.

Suggested UI text:

"Human review required. This prototype highlights potential risks but does not guarantee compliance."

---

# Recommended File Structure

If building as a simple React app, use a straightforward structure:

src/
  App.jsx
  components/
    Header.jsx
    InputPanel.jsx
    FindingsPanel.jsx
    OutputPanel.jsx
    IdentifierReference.jsx
  utils/
    detectionRules.js
    sanitizeText.js
  data/
    sampleDrafts.js
  styles/
    app.css

If building as a simple HTML/CSS/JavaScript prototype, keep everything simple:

index.html
styles.css
script.js

Choose the simplest implementation that produces a polished browser demo.

---

# Final Direction for Devin

Build the HIPAA Shield Agent as a single-page browser prototype.

Prioritize clarity over technical sophistication.

The prototype should make this story visible:

A staff member pastes a risky patient communication.

The tool immediately identifies potential PHI risks.

The tool generates a safer version for human review.

The stakeholder can understand the workflow quickly and decide whether the concept is worth exploring further.