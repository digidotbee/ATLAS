# Venture launch

Use this document for the creation wizard and the four MVP roles. It records the decisions in the ORIVOIR living PRD v0.12, dated November 18, 2026.

## Creation wizard

**Start a Venture** opens **Set the Scene**. Aim for a launch in under 90 seconds. A Planner can fill out all four screens and preview the invitation before signing in.

| Step | Planner action |
| --- | --- |
| 1. Set the Scene | Enter a destination, spot, or vibe. A Venture title and broader area are optional. |
| 2. Schedule | **Set a date** supports a single day or evening with optional times, or a multi-day Venture. **Set for date decision** takes an earliest start, latest wrap-up, optional ideal length, and a required **Opt in by** deadline. Offer 24 hours, 3 days, or a custom deadline. |
| 3. Crew | Review the planning headcount, including the Planner and anyone expected to attend without responding. The Planner can use household defaults. A named roster is optional. With shared joining, **Max crew opt-ins** is a separate optional limit on people joining by link. Leaving it blank allows uncapped joining while the window is open. |
| 4. Budget & Launch | Choose **Total (Everything included)**, **Per person**, or **Skip for now**. Review the invite card with the fixed date or proposed window. Date Decision also shows **Opt in by**. Skipping the budget keeps the Planner on this screen. **Launch Venture** is the final action. |

The Planner can revisit a completed step and edit it without losing later answers. The final preview reflects those edits. On launch, a fixed-date Venture opens planning. A Venture with a date to decide opens Date Decision.

## MVP roles

| Role | Account | What the person can do |
| --- | --- | --- |
| Planner | Required at **Launch Venture** | Own the Venture, share the invite, manage access, lock the date and plan choices, and lead planning. |
| Collaborator | Required | Opt in, submit availability and RSVP, give or withdraw a 👍 on open options, suggest ideas, and start child Ventures. |
| Attendee | Optional | Opt in, submit their own availability and RSVP, and give or withdraw a 👍 on open options. A private response credential restores their Crew entry. |
| Viewer | Required to request access | After Planner approval, read the redacted plan from **My Ventures → Following**. |

An Attendee who becomes a Collaborator links their verified account to the existing entry using the private response credential. They keep their spot, availability, RSVP, and support votes. Collaborator actions use the linked account.

## Implementation milestones

- **Wizard** uses local persistence and the existing planning and Date Decision workspaces. The invite preview is available for both schedule modes.
- **Budget persistence** will save the entered amount, currency, and basis, including after a headcount change. The existing storage format saves the group total.
- **Shared launch and joining** will resume the Planner's draft after email-code sign-in at launch, generate one group link, and enforce role permissions and the optional opt-in limit on the server. A successful first response takes one spot. Opening the link uses none.
