# Venture launch

Use this document for the creation wizard and the four MVP roles in the [ORIVOIR living PRD v0.18](prd.md), dated November 21, 2026. The backend, delivery rules and test cases for both invitation paths are in [Crew invitations](crew-invitations.md).

## Creation wizard

**Start a Venture** opens **Set the Scene**. Aim for a launch in under 90 seconds. A Planner can fill out all four screens and preview the invitation before signing in.

| Step | Planner action |
| --- | --- |
| 1. Set the Scene | Enter a destination, spot, or vibe. A Venture title and broader area are optional. |
| 2. Schedule | **Set a date** supports a single day or evening with optional times, or a multi-day Venture. **Set for date decision** takes an earliest start, latest wrap-up, optional ideal length, and a required **Opt in by** deadline. Offer 24 hours, 3 days, or a custom deadline. |
| 3. Crew | **Choose from contacts** or **Add by phone or email**. Review the selected people and one destination per person. The Planner can leave the list empty and share a group link after launch. Keep the optional **Max crew opt-ins** separate from the planning headcount, which can include the Planner, household defaults and people attending without a response. Both invite paths use the same capacity check. |
| 4. Budget & Launch | Choose **Total (Everything included)**, **Per person**, or **Skip for now**. Preview the card, including **Opt in by** for Date Decision. **Launch & invite N** creates the Venture and queues N personal invitations in one action. With nobody selected, **Launch Venture** creates the Venture for sharing. Skipping Budget stays on this screen. |

The Planner can revisit a completed step and edit it without losing later answers. The final preview reflects those edits. On launch, a fixed-date Venture opens planning. A Venture with a date to decide opens Date Decision.

## MVP roles

| Role | Account | What the person can do |
| --- | --- | --- |
| Planner | Required at launch | Own the Venture, send personal invitations, share the group link, manage access, lock the date and plan choices, and lead planning. Email-code sign-in restores the draft and selected recipients. |
| Collaborator | Required | Opt in, submit availability and RSVP, give or withdraw a 👍 on open options, suggest ideas, and start child Ventures. |
| Attendee | Optional | Opt in, submit their own availability and RSVP, and give or withdraw a 👍 on open options. A private response credential restores their Crew entry. |
| Viewer | Required to request access | A private emailed **Request to follow** action signs in or creates the account and submits one pending request. A signed-in group-link visitor can request directly. After Planner approval, read the redacted plan from **My Ventures → Following**. |

An Attendee who becomes a Collaborator links their verified account to the existing entry using the private response credential. They keep their spot, availability, RSVP, and support votes. Collaborator actions use the linked account.

## Implementation milestones

The full build order for all 40 stories, with decisions and dependencies, is in the [implementation plan](implementation-plan.md). The notes below cover launch.

- **Wizard** uses local persistence and the existing planning and Date Decision workspaces. The invite preview is available for both schedule modes.
- **Budget persistence** saves the entered amount, currency, and basis. A per-person budget keeps the amount the Planner entered, and the group total follows every headcount change. Every budget calculation still reads the saved group total, so Ventures saved earlier load as total budgets without migration. The Budget pill under the Venture title shows the target as entered, such as **$150 per person** or **$600 total**, or **+Set budget**. Every state opens the Budget view, where the Planner sets or edits the target and sees the planning headcount from **Who**. Switching the basis keeps the group total. See [BUDGET-01](user-stories.md#budget-01).
- **Shared launch and joining** will use direct personal SMS/email invitations and retain one forwardable group link per Venture. The first successful availability or RSVP response takes one spot. Sending, opening and previewing use none. Planner contact photos and delivery details stay private.
- **Date Lock-In** prepares the ordinary **Set a date** card for eligible Crew. The Planner can send it in one action or share the group URL. An RSVP updates the same Crew entry that supplied availability.
