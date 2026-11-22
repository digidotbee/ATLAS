# ORIVOIR Living PRD

**Version 0.18 · November 21, 2026 · MVP v1.0**

[User stories and acceptance criteria](user-stories.md)

## Product intent

**Founder’s vision.** A friendly, intentional app that makes it effortless for my friends and family to plan adventures together.

“Good things await. Gather your people. Pick a date. Plan something worth looking forward to together.”

ORIVOIR helps groups coordinate Ventures ranging from a few hours to several weeks. The Planner journey takes a group from a rough idea to a locked date, coordinated plans and transit, and a shared budget. Human decisions drive the flow. The consumer core is free.

This version defines creation, Date Lock-In, account requirements, and access for Viewers. It also defines the Plan Board, shared budget, and optional in-app AI suggestions and records the remaining Journey 1 milestones for later ideation. Update this document as decisions change and add a dated entry to the revision history.

## Roles and accounts

| Role | Account requirement | MVP permissions |
|---|---|---|
| Planner | Required at launch. The wizard, Crew selection and card preview work before sign-in. | Owns the Venture, sends personal invitations, shares the group link, locks the date, manages access, and leads planning. |
| Collaborator | Account required. A private response credential restores the same Crew entry. | Can opt in, submit their own availability and RSVP, support options open for voting, add suggestions, and start child Ventures. |
| Attendee | No account required. A private response credential restores the same Crew entry. | Can opt in, submit their own availability and RSVP, and give or withdraw a 👍 on options open for voting. |
| Viewer | Required to submit a view-only access request. | After Planner approval, can open the shared, redacted plan from **My Ventures → Following**. |

For Planner and Collaborator sign-in or account creation, ORIVOIR emails a temporary code such as `482913` to the person’s address. They enter it in the browser. The sign-in service checks that it matches the address, is unexpired and unused, then accepts it once and signs them in. Preserve the Planner’s draft, selected contacts, delivery choices and invite preview through sign-in and return them to the final launch action. For a Viewer requesting access, put a private sign-in link inside the email’s **Request to follow** button so they can complete the action without typing a code. An ordinary Attendee can respond from a personal invite or the group link without an account. All invite flows work in the browser.

## Venture creation

### Homepage entry

The Planner lands on a homepage with an illustrated hero, the headline **Good things await.**, and the subtitle “Gather your people. Pick a date. Plan something worth looking forward to together.” Selecting **Start a Venture** opens **Set the Scene**, the first step in the creation wizard. Below the hero, the homepage shows the Planner’s Ventures or an empty state.

[Homepage source](../src/ui/TripList.tsx#L176-L200)

### Creation wizard

Aim for a four-step wizard that takes under 90 seconds. Keep optional travel fields out of casual Ventures.

| Step | Requirements |
|---|---|
| Set the Scene | Capture a destination, spot, or vibe. Venture title and broader area are optional. |
| Schedule | **Set a date** supports a single day or evening, optional times, and multi-day Ventures. **Set for date decision** captures the earliest start, latest wrap-up, optional ideal length, and required **Opt in by** cutoff. Offer 24 hours, 3 days, or a custom deadline. |
| Crew | **Choose from contacts** is the primary action where supported. **Add by phone or email** is available to everyone. Review one delivery destination per selected person. Keep the optional planning headcount and **Max crew opt-ins** separate. The Planner can continue with an empty list. |
| Budget & Launch | Offer **Total (Everything included)**, **Per person**, and **Skip for now**. Save the amount, currency, and basis. Preview the invite card and show **Opt in by** for Date Decision. With ready recipients, **Launch & invite N** creates the Venture and sends a personal invitation to each in one action. With no selection, **Launch Venture** creates the Venture and offers **Share a group link**. Skipping Budget keeps the final action on this screen. |

Fixed dates launch directly into **planning** with the standard **Set a date** RSVP invitation. Its card shows the Venture title, the date or date range, and any set times in the Venture time zone. Date Decision launches into **voting** with an availability invitation. Existing Crew members return from availability to RSVP through their private response access.

### Crew opt-in and sharing

**Choose people.** A tap opens the device picker where supported. Request only the contacts and available fields the Planner selects. Show each selected person with their name, contact photo or initials, and chosen mobile number or email. Let the Planner edit or remove a row. If contact access is unavailable, declined, canceled or missing a field, keep the selection and offer manual entry. Repeated selection of the same recipient creates one invitation. Two people with the same name remain distinct.

**Send together.** ORIVOIR delivers one personal SMS or email per selected recipient on the Planner’s behalf. Each message identifies the Planner and Venture and opens that recipient’s invitation. Give SMS a readable text-and-link fallback when the client omits a rich preview. The final button counts ready destinations. Show unresolved rows before launch and offer an alternate destination or **Share personal invite**. After launch, **Send N invites** adds people with the same flow. If five of six messages send, the Planner can retry only the failed recipient. Delivery status is visible independently of the person’s answer.

| How someone arrives | What happens |
|---|---|
| Personal invitation | The private link identifies one recipient’s invitation to this Venture. The person can submit availability, including **None of these work**, or a fixed-date RSVP without an account, app or name prompt. A forwarded personal link carries the same invitation access. |
| **Share a group link** | One forwardable link works in an existing group conversation. A new visitor enters a display name and joins while entry is open. A returning member with private response access resumes their existing entry. The link alone cannot identify each recipient or list who has yet to answer. |
| Return or upgrade | Show **Responding as [name]** and offer private **Manage my response** for another device. A valid personal return link resolves to the same invitation or member. Each member has one current availability response and one current RSVP. Linking a verified Collaborator account requires the member’s private credential and preserves their spot, votes and responses. |

**Recognize the reply.** In the Planner’s **Who** view, a saved contact can appear as **Mom · Saturday works** with her contact photo. The selected number or email is available in her row details. The rest of the Crew sees only the name and photo the invitee elects to share. Address-book labels, photos and destinations stay private to the Planner. Named invitations awaiting a reply can be listed separately from active Crew. A message preview or delivery receipt does not establish attendance.

**Count a response once.** Both links use the same **Max crew opt-ins**. With the limit blank, joining is uncapped while open. The planning headcount can include the Planner and people attending without responding. Sending or opening uses zero spots. The first successful availability or RSVP submission creates one active Attendee entry and takes one spot. Concurrent submissions for the last spot admit one new member. A further new join sees **This Venture has departed. All [limit] spots are filled.** Existing members can update availability while voting is open. The cutoff or early lock closes Date Decision to new opt-ins. Late visitors can **Request to follow**. **Remove from Crew** revokes the member’s private links, excludes their responses from active counts and reopens a spot if joining remains open. The Planner can also raise the limit. A removed person can make a fresh opt-in through the group link while joining is open.

**Delivery permissions.** Enable channels supported for the destination and permitted under ORIVOIR’s provider arrangements. Selecting a phone contact shares it with the app for this invitation. Separately establish the permission required for sending an SMS on the Planner’s behalf. After an availability reply, a guest can choose **Text me when [Planner] picks a date** for this Venture. Honor withdrawals and offer email or a link wherever direct SMS is unavailable. If every selected route needs attention, **Launch Venture** saves the invitations for later and offers the group link. Paperless Post is the experience reference. ORIVOIR implements the flow and calls delivery services directly.

### Budget amount and basis

The current wizard multiplies a per-person entry by the party size at creation and saves only the resulting total. Preserve the original budget entry in new and edited Ventures. The Budget pill reads from that saved entry and displays both the amount and its basis. For example, **$150 per person** still displays after the party grows from four to six. A group estimate can be derived when needed using an explicit headcount without overwriting the saved entry. For older Ventures with only a saved total, display it as a total. The Planner can edit the budget to set a per-person amount.

## Date Lock-In

The voting workspace shows response pills, a cutoff countdown, and overlap across candidate windows. The PRD calls for a dual-layer heatmap that surfaces overlap matching the preferred duration. The exact method for generating candidate windows remains open.

For weekend options, the first invite asks **Which weekends could work for you?** One tap selects an entire window. On a multi-day option, **I can join for part** opens the dates in that window in the Venture time zone. Invitees select the days they can come, even if those days are separated. They can answer for several windows and submit once. Selecting every day counts as a whole-window answer. **None of these work** clears all selections and records an explicit empty response on submission.

For each window, count each respondent once, either for the whole window or for part of it. Show which days partial respondents can join. A daily total includes both whole-window respondents and people who selected that day. Edits replace the person’s previous selections while voting is open.

| Situation | Product behavior |
|---|---|
| Voting is open | Invitees can submit or edit their availability. The Planner sees whole-window and partial availability, overlap by day, and the response status of known Crew members. |
| Cutoff passes | Availability submissions close at the server. The Venture remains in the date-decision workspace with voting closed. The Planner sees the results and can lock a time or move the cutoff forward. Only people who successfully opted in appear on the Crew response roster. |
| Everyone replies without a clear match | Show the overlap and let the Planner lock a partial match or revise the options and reopen voting. Revising options should prompt a fresh response for the new choices. |
| Planner locks a time | An explicit **Lock this time** action saves the chosen window, moves the Venture into **planning**, and starts the standard fixed-date invitation send flow. An early lock closes voting immediately. |
| Eligible invitee returns after lock-in | The same link shows the chosen time and **Count me in** or **Can’t make it**. The Planner sees confirmed, declined, and pending attendance. Availability totals remain separate from RSVP totals. |
| New visitor arrives after joining closes | Show the departure screen with **Request to follow** and explain that the Planner can approve view-only access. Opening the link earlier did not reserve a spot. |

**Resend the fixed-date invitation.** After **Lock this time** succeeds, prepare the same **Set a date** card, date/time details, RSVP actions and channel-specific notification text as a fixed-date launch. **Send date to N** sends to active Crew members with an eligible direct route, including group-link respondents who requested that update. Each direct message resolves to the same invitation or membership that supplied availability. **Share a group link** reuses the original group URL for group conversations. Leave unjoined, removed or suppressed recipients off the direct resend. Dismissing the send or retrying a failure leaves the date locked. Either message opens the current Venture state. Availability alone leaves attendance pending.

**Example.** Maya submits availability for Friday and Saturday from 6–9 PM Pacific. Jules opens the link before cutoff but never submits, so no Crew entry exists for Jules. The Planner locks Saturday and Maya confirms through her private response access. Jules can request view-only access.

## View-only access

The Viewer’s action is **Request to follow**. A private email might read “Dot invited you to follow Big Bear Weekend. You can see the plan once Dot approves your request.”

| How the Viewer arrives | What happens when they tap **Request to follow** |
|---|---|
| Private invitation emailed by ORIVOIR | The email button opens ORIVOIR in the browser. In one tap, ORIVOIR verifies the link, signs the recipient in or creates their account, and submits the request for this Venture. The Viewer sees **Request sent**. |
| Group link, already signed in | The group card identifies the Venture. One tap on **Request to follow** on its landing page submits the request from the current account. |
| Group link, signed out | The visitor selects **Request to follow** and enters their own email address. ORIVOIR emails them the private button above. Tapping it completes the original request without reentering their email or finding the Venture again. |

The Planner sees the pending request and can approve or decline it. Approval grants the signed-in account Viewer access. The Venture appears under **My Ventures → Following** on any signed-in device. The Viewer can read the shared plan. Home addresses and minors’ details are redacted before the data reaches their device. The Planner can revoke access, which removes the Venture from **Following** and denies future reads. Requesting to follow uses no Crew spot and records no RSVP.

**How the button works.** The invite card JSON supplies a title, a button label, and an `actionUrl`. For a private Viewer email, the server issues a random, expiring, single-use token tied to the recipient’s email, this Venture, and the follow request. ORIVOIR delivers the token inside the button’s HTTPS link. Tapping the button returns it to ORIVOIR for verification. Repeated taps create at most one pending request per account and Venture. If the link has expired, offer **Send a new link** for the same request.

**Sharing and previews.** **Share a group link** always builds the forwardable card with the group URL. Keep private Crew and Viewer tokens out of group cards and preview metadata. Forwarding the original private Viewer email can pass its live sign-in link to the next reader. A message preview or an automated email scan must leave the token usable and the request unsubmitted. If the app needs to confirm a human tap, show **Request to follow** on the landing page.

## Plan Board

Fixed-date launch and Date Lock-In both open the Plan Board. Generate expandable day sections from the locked dates in the Venture time zone. Open the day by default for a one-day Venture. Summarize each collapsed day with open and decided counts. Use **Whole Trip** for decisions that span days, such as lodging.

The Planner adds a **decision card** to a day or to Whole Trip. A title such as “Dinner” is enough to start. An optional time window, spending limit, or note gives the crew context. Show **Suggest an idea** on the decision card for the Planner and Collaborators.

The **Add to plan** category list includes **A place to stay**. Choosing it opens a decision card with the editable title **Where are we staying?** The Planner and Collaborators can suggest a hotel, a cabin, a campsite, or a stay with friends on the same card. One card can cover several nights. The Planner adds it only when the Venture needs it.

### Suggestions and provider searches

Use one horizontally scrolling carousel of option cards per decision. Manual entry, provider links, and supported provider JSON all use the same editable **Add Idea** form and provider-independent card schema. Map recognized provider fields into that schema. An unfamiliar link can still be saved as the source, with the crew supplying any missing details. A title is the only required input. Optional fields include a note, place, source URL, proposed time, and estimated cost with currency and basis.

Show applicable dates and spending limits from Date Lock-In, the decision, and Budget without asking people to re-enter them. A proposed time or quoted cost belongs to the option. Pass date and budget constraints to providers where supported. Otherwise rank or flag results where available data supports a comparison. A whole-Venture budget provides context until a decision-specific limit is set. Start with provider links, using OpenTable for the dinner scenario. Deeper provider integrations depend on supported access.

### Support and decision lock

Each option open for voting has a 👍 support toggle. The Planner, Collaborators, and Attendees can give or withdraw support on any number of open options through their own Crew access. Support counts update independently of Venture RSVP. An unchecked box expresses no support signal. The Planner can lock a choice without waiting for votes.

Locking a choice moves it to the first position in the same carousel and gives it a **Locked in** label. Keep all other options in the carousel and support toggles active on every option open for voting, including the locked one. Support changes update counts without changing the locked choice or its first position. If the Planner explicitly locks a different choice, that choice moves first. The same decision card appears immediately in the day’s itinerary when the Planner locks an option. **Lock this option** is the only required action. The card carries the locked option’s details into the plan automatically.

**Lodging acceptance check.** For a Friday–Sunday Venture, the crew compares a hotel and a cabin on one card. The Planner locks the cabin at $360 total for both nights. The itinerary shows one stay covering Friday and Saturday nights. If the cabin is included in the shared budget, it contributes $360 once.

### Itinerary, time, and booking

- Show the exact time when known. Otherwise show the existing time window, such as **6–9 p.m.**, or **Time TBD** if no time has been set. The Planner can add or edit the exact time on the same card.
- Show the known location and its Mapbox pin automatically when coordinates are available.
- The Planner can optionally mark the locked option **Booked** on the same card. The Planner handles reservations and cancellations with the provider.
- If the Planner locks a different option, update the itinerary immediately and move the new choice to the front of the carousel. If the previous choice was marked **Booked**, show the Planner one reminder to check that reservation. Booking status stays with the option it describes.

**Acceptance check.** Maya, a Collaborator, adds a restaurant link under Saturday Dinner. Jules, an Attendee, gives a 👍 to two open options. The Planner locks one and it appears first. Jules can still swipe to another option and change their support. The locked option stays first and Jules’s RSVP stays as it was. The same Dinner card immediately appears in Saturday’s itinerary with the existing 6–9 p.m. window and a map pin when available. The Planner can optionally enter 7 p.m. or mark the restaurant **Booked**. If the Planner switches away from a booked restaurant, the itinerary updates and the Planner sees one reminder to check the old reservation.

## Delegated planning · Child Ventures

A Collaborator can start a child Venture from the Plan Board to organize a plan for a subset of the crew. They become the Planner of that child Venture and own its schedule, choices, invitations, and RSVPs. The main Planner continues to manage the main Venture and its shared itinerary. When the crew only needs an activity headcount or a point person, a regular Plan Board card is enough.

### Launch and share

1. **Start a side plan.** Enter a title from the main Plan Board. Use the main Venture’s dates, time zone, and broad location as context. The child Planner can add a settled plan directly or use the existing date and option decision flows where needed. Any child date must fit within the main Venture.
2. **Launch to the crew.** Require a signed-in Collaborator linked to an active Crew entry in the main Venture to start and launch a child Venture. The child Planner can invite a subset of the existing crew. Invitees can use their personal links, and child RSVPs are independent of main Venture RSVPs.
3. **Offer it to the shared itinerary.** The child Planner can ask the main Planner to include the side plan. Launching to the subgroup can happen before this approval. After approval, the shared itinerary shows an optional plan summary that links to the child Venture. Child planning details are available to the child participants and the main Planner, subject to their access permissions.

### Ownership and lifecycle

- Store the child as a Venture linked to its main Venture. Authorize actions against the relevant Venture membership and role. Limit nesting to one level and invitations to the main Venture’s crew.
- Keep the child Venture as the source for the approved itinerary entry. Time, meeting point, and cancellation updates flow through the link. If the main dates change, flag the child plan for its Planner to review and withhold it from the updated itinerary until its schedule fits.
- Track child costs in the child Venture. The main Planner can include an agreed child cost in the main budget through a linked entry that stays up to date and counts once.

**Acceptance check.** Six people RSVP to the cabin weekend. Jules launches Saturday kayaking and four crew members join. The main Planner approves kayaking for the shared itinerary. Jules moves it from 10 a.m. to 11 a.m., and the itinerary shows the new time from the child Venture. The weekend still has six RSVPs, kayaking still has four, and the shared budget counts any linked kayaking cost once.

## Plan Board · AI-assisted suggestions

When a Venture enters planning, the Plan Board shows what is settled and which decisions are still open. For an open venue decision, offer **Find dinner ideas** alongside manual entry. The same interaction can later support lodging or activities. The goal is to make it easier for the crew to plan a real-world Venture together.

1. The Planner can start from the Plan Board after connecting Gemini. A signed-in Collaborator can generate ideas if the Planner enables it for that Venture, including while their RSVP is pending.
2. ORIVOIR builds and sends the prompt in-app using the locked date and time, broad area, budget if known, and any preferences the requester adds. Exclude crew names, contact details, private addresses, minors’ details, and invite links from automatically included context.
3. The backend calls the provider using the Planner’s connection and requests JSON matching a schema. Validate the response and render private draft cards with a name, location, reason it fits, and details that need checking. If the provider is unavailable, quota is exhausted, or the response is invalid, show an actionable message and keep manual suggestions available.
4. The requester can edit a draft and choose **Suggest to crew**. Only explicitly shared cards appear on the board. They use the same support toggles and lock-to-itinerary flow as manual suggestions. Generating or sharing ideas does not change RSVP status.

**Pilot connection.** Start with Gemini as an optional Planner feature. Only the Planner enters a Gemini Developer API key. Keep credentials server-side. Collaborator generation is off by default and can be enabled or revoked per Venture. Apply a Planner-controlled request limit and show usage. Generation uses the connected API project’s quota and billing. Ordinary assistant sign-in alone does not provide the required API access. Easier provider setup for broader release and support for additional providers remain open.

**Acceptance checks.** A signed-in Collaborator with Planner-enabled access can receive draft cards entirely inside ORIVOIR without copying a prompt or pasting a reply. Another invitee sees only cards explicitly shared with the crew. A Viewer cannot generate or post suggestions. A failed request creates no board cards, and manual entry works without a provider connection.

## Routing and data

These are proposed routes and data contracts. The implementation should map them onto the existing Vite, React, TypeScript, Tailwind CSS, Mapbox GL, and Supabase stack. GitHub Pages uses hash routing today. A future move to orivoir.com, hosted on Cloudflare (implementation plan D1), supports share previews.

| Surface | Proposed route | Access |
|---|---|---|
| Date Decision | `/ventures/:ventureId/dates` | Authenticated Planner |
| Plan Board | `/ventures/:ventureId/plan` | Planner and Collaborator access through signed-in membership. Attendees use their private response credential for eligible plan options and support votes. Approved Viewers have redacted read access. |
| Group invite | `/invite/:token` | Shared Venture link for joining while open or requesting to follow |
| Personal Crew invite | Proposed `/i/:token` | Private invitation to one Venture, scoped to the intended recipient’s availability and RSVP. Opening or previewing a card has no side effects on joining or answering. |
| Private Viewer invitation | Recipient-specific email action URL | Signs the recipient in and submits one follow request for the named Venture. The Planner approves access. |
| Manage my response | Proposed private member link | Scoped access to the member’s availability, RSVP, and support votes |
| Following | `/my-ventures/following` | Signed-in account, with approved Ventures listed |

| Data | Required fields and behavior |
|---|---|
| Venture | Planner account ID, schedule mode, status, time zone, cutoff, target window, optional opt-in limit, optional ideal length, and locked start and end or slot reference. Store instants with timezone-aware timestamps. |
| Candidate window | Venture ID, stable slot ID, start and end. |
| Crew invitation | Venture ID, stable recipient invitation ID, issuing Planner, private contact label, optional photo, selected SMS/email destination, pending/claimed/revoked state, nullable Crew membership ID and scoped token digest. Personal details are visible to the Planner. |
| Invitation delivery | Invitation or opted-in membership, send operation, message purpose, schedule version, channel, status, attempts and provider reference. Record applicable SMS permission and suppression. Retrying one failed delivery preserves the other recipients and their responses. |
| Crew membership | Venture ID, collaborator ID, display name, role, account ID required for Collaborators and optional for Attendees, opt-in timestamp, and active or removed status. Store private response credentials securely and revoke access on removal. |
| Availability response | Crew membership ID, submitted timestamp, and selected slots or availability ranges. For each multi-day candidate, retain its stable ID and either whole-window availability or the specific available dates within it, in the Venture time zone. A submitted empty selection means **None of these work**. A missing submission means pending. |
| Attendance response | Crew membership ID, fixed or locked schedule, and confirmed or declined status. A missing response means pending. |
| Follower access | Venture ID and authenticated user ID, unique as a pair. Status is pending, approved, declined, or revoked. |

Supabase owns authorization and timing. A server transaction checks join scope, Venture phase, cutoff, and capacity before creating a membership and its first response together. Updates check active membership, role, and the relevant phase. Private response credentials authorize only the member’s own responses and support on options open for voting. Adding suggestions or starting child Ventures requires a signed-in Collaborator or Planner with access to the Venture. Locking the date and switching to planning happen atomically. Realtime updates Planner counts. The invite page reloads state when reopened and handles a stale submission by showing the current phase. Account membership and server-side redaction govern Viewer reads.

Launch records the Venture, invitations and queued deliveries atomically. Supabase workers send via server-held provider credentials. Repeated taps resume the same operation. Reconcile an uncertain provider result before retrying. Provider acceptance can mark an item sent, a delivery receipt can mark it delivered, and only an explicit guest response updates attendance. Build order, source licenses and test cases are in the [Crew invitations engineering guide](crew-invitations.md).

## MVP acceptance checks

- Save a budget of $150 per person with four people, change the headcount to six, and reopen the Venture. The Budget pill still shows **$150 per person**. If a group estimate is shown for six people, it is $900. A budget entered as **$600 total** continues to show **$600 total** after the same headcount change. A legacy total displays as a total.

- On the homepage, **Start a Venture** opens **Set the Scene**.
- The wizard presents **Set the Scene → Schedule → Crew → Budget & Launch**. The final action stays on that screen after **Skip for now**. With zero selected people it reads **Launch Venture**. With six ready people it reads **Launch & invite 6**.
- A signed-out Planner can choose contacts or add them manually, authenticate and return to the same draft, recipients and preview. Canceling or declining the picker preserves previous entries. A missing photo displays initials.
- Launch to six mixed SMS/email contacts. Each receives their own link and a response maps to their selected contact. Simulate five successes and one failure. A retry sends only the failed invitation. Replaying a launch request, delivery callback or submitted reply preserves one Venture, one intended invitation per recipient and one membership per respondent.
- An ordinary personal invite opens in the browser with the intended person already identified. Their address-book nickname, photo and contact route stay in the Planner view. A group card is forwardable and contains only the group URL. A link preview consumes no spot or credential.
- Two people with the same name can join without accounts. Each can edit only their own response. Reopening the group link in the same browser restores the existing membership. The private manage link restores it on another device.
- An Attendee can submit availability, RSVP, and give or withdraw a 👍 on an option open for voting without an account. Adding an idea or starting a child Venture requires a signed-in Collaborator. Linking an account using the Attendee’s private response credential preserves their Crew entry, spot, availability, RSVP, and votes.
- With six spots and five active Crew members, two simultaneous new submissions produce exactly one successful opt-in. An open or preview consumes no spot. Existing Crew can still vote until cutoff and RSVP after lock.
- Removing a Crew member revokes their access, drops their responses from active counts, and makes a spot available if joining is still open. Raising the limit also frees capacity while joining is open.
- A stale voting tab cannot submit after the cutoff or after an early lock. Extending the cutoff before lock reopens eligible voting and allows new joins where capacity permits.
- With zero replies, partial replies, or tied results, the Venture stays in Date Decision until the Planner explicitly locks a time.
- For June 11–13, 2027, four whole-weekend replies and one Saturday-only reply display as **4 for the whole weekend · 1 for Saturday only**. Five people are available on Saturday. If the Saturday-only guest changes to the whole weekend while voting is open, the result becomes five whole and zero partial. Answering for another weekend uses the same Crew entry.
- Eligible invitees can RSVP on the same link. Both whole-window and partial availability leave attendance pending until the person RSVPs to the locked dates.
- Given the same Venture and settled schedule, fixed-date launch and Date Lock-In produce the same card and recipient-facing notification wording for each channel. The direct resend preserves each eligible person’s identity, and the group share preserves the original group URL. A group-only guest may opt into a date text. An unjoined invitee sees the departure screen after lock. A failed or dismissed send leaves the schedule locked.
- A preview of a private Viewer email leaves the request unsubmitted. In the ordinary one-tap flow, selecting the email button shows **Request sent** without code entry. Tapping it twice creates one pending request and takes no Crew spot.
- A signed-in visitor can request to follow from a forwarded group link in one tap. A signed-out visitor completes the same request from a private link sent to their own inbox. A pending request grants no plan access. Approval makes the Venture visible under **Following** on another signed-in device. Revocation blocks direct access as well as removing the listing.
- A Viewer cannot mutate a plan or receive redacted fields. Existing repository tests remain passing as the feature is implemented.

## Remaining ideation

| Area | Next decision |
|---|---|
| Availability | Decide how to generate candidate windows from the Planner’s range and ideal length, and how to enter partial availability within a single evening. One option for **Weekend** is to suggest editable Friday–Sunday windows. |
| Partial attendance details | Active members can RSVP to locked dates. Decide how someone who offered specific days records attendance for only part of the locked Venture and which additional plan details they can see. |
| Direct delivery rollout | Choose providers, supported destinations and sender setup. Verify first-invite and update permissions before enabling each SMS route. |
| Rescheduling | Define what happens to invitations and attendance when a locked date changes. |
| Transit | Specify chained Plane, Car, Ship/Cruise, and Train/Bus legs, including the 90-minute Shared Transfer Window. |

Use ORIVOIR’s dark navy, layered teal and sage graphics, lime primary actions, and compact pill controls throughout. The north star remains **Completed Shared Ventures per Active Household**. The pilot targets at least 55% invitee link voting and 35% organizer repeat use within 45 days.

## Shared Budget journey

The Planner signed off on this journey on November 18, 2026.

1. **Set a target.** Offer the optional target in **Budget & Launch**, after **Crew**. The existing planning header displays the saved basis as **$150 per person** or **$600 total**. If skipped, show **+Set budget**. Every state opens the Budget view, and the Planner can add or edit the target there.
2. **Compare options.** Plan Board cards show price and basis when known. Unselected suggestions stay out of the running cost. When the Planner replaces a $360 cabin with a $480 option, preview **Adds $120 to the plan**. After selection, the replacement contributes once.
3. **Track selected costs.** An estimated price joins the running cost when its option is selected. Confirming the agreed or booked amount replaces the estimate for that item. Show **Cost TBD** for unknown selected costs and count a cost explicitly marked **Free** as $0. Show how far known costs exceed the target even when other items are pending.
4. **Use the planning headcount.** Default to the count in **Who** and display the count used. A per-person line can override quantity, such as four tickets for six people. An estimated per-person line using the default count recalculates when headcount changes. Confirmed bookings retain the recorded price and booked quantity. If four booked tickets cover a six-person crew, show **4 tickets confirmed** and surface the difference when all six were expected to participate.
5. **Share what the plan covers.** Count selected costs the crew agrees are part of the budget, regardless of who pays. Show other tracked costs separately when excluded, such as individually arranged transit. State the scope beside the rollup. Show the crew an **average per person** based on the displayed planning headcount and scope. Individual costs can differ.
6. **Read completion from the costs.** Once every included selected cost is confirmed, show **All selected costs confirmed** with the confirmed total. While incomplete, show the running cost, the confirmed portion, and outstanding **Cost TBD** items. The MVP has no separate budget finalization action.

**Cabin weekend.** Four people at $150 per person have a $600 target. A $360 cabin and a $25-per-person activity produce a $460 running estimate with dinner still TBD. At six people, the target becomes $900 and the estimate becomes $510. The pill still reads $150 per person. Confirm the cabin at $390, the activity at $150, and dinner at $180. The final view shows $720 confirmed and a $120 average per person for six.

### Budget acceptance checks

- A Venture launched without a target can select and confirm costs. The Planner can set the target later from **+Set budget**.
- Swapping options replaces the old cost. Confirming a cost replaces its estimate exactly once. Free and unknown costs remain distinguishable.
- Headcount changes recalculate per-person targets and estimates that use the default quantity. Fixed totals, overridden quantities, and confirmed bookings retain their saved values.
- A separately paid cost can count toward the budget when included. Excluded costs stay outside the running total and per-person average, with the scope visible to the crew.

## Icebox

### Roll the dice for a date

- In Date Decision, the Planner enters dates or selects existing date options to include in the draw.
- Tapping the dice button randomly selects one date from that list. The Planner can then lock the result using the existing date lock action.
- When the Planner locks the result, save that it was picked by the dice and show a red dice icon beside the locked date. Give the icon the accessible label **Chosen by dice**.

## Revision history

| Version | Date | Change |
|---|---|---|
| 0.1 | November 18, 2026 | Captured the creation flow, hard availability cutoff, explicit date lock, guest RSVP, and account-linked view-only access. |
| 0.2 | November 18, 2026 | Added in-app AI suggestions, structured draft cards, crew sharing, and the Gemini pilot connection. |
| 0.3 | November 18, 2026 | Defined expandable days, decision and option cards, inherited planning constraints, provider links, and continued support voting after lock. Updated the optional Gemini pilot to use Planner connections. |
| 0.4 | November 18, 2026 | Made locking an option update the itinerary immediately and defined optional time, map, and booking behavior. |
| 0.5 | November 18, 2026 | Preserved the original budget amount, currency, and basis so the Budget pill stays accurate when headcount changes. |
| 0.6 | November 18, 2026 | Recorded Planner sign-off on the Shared Budget journey, including cost scope, headcount, and confirmation. |
| 0.7 | November 18, 2026 | Reordered the wizard to Set the Scene → Schedule → Crew → Budget & Launch. Kept launch on the final screen when Budget is skipped and updated the Plan Board pill to **+Set budget**. |
| 0.8 | November 18, 2026 | Added a dice button for random date selection to the icebox, with a red dice flag on dates locked from the draw. |
| 0.9 | November 18, 2026 | Added delegated planning through child Ventures, including launch permissions, separate RSVPs, and main Planner approval for shared itinerary placement. |
| 0.10 | November 18, 2026 | Documented the existing homepage hero, copy, and **Start a Venture** entry into the creation wizard. |
| 0.11 | November 18, 2026 | Defined shared Venture links, account-free Crew opt-in, private response access, optional capacity, and Planner removal. |
| 0.12 | November 18, 2026 | Updated the MVP roles to Planner, Collaborator, Attendee, and Viewer. Defined account requirements, account-free support votes, and Crew entry continuity when an Attendee becomes a Collaborator. |
| 0.13 | November 20, 2026 | Added **A place to stay** to the Plan Board’s **Add to plan** list and defined how one lodging decision covers multiple nights. |
| 0.14 | November 20, 2026 | Recorded the founder’s vision for friends and family to plan adventures together effortlessly. |
| 0.15 | November 20, 2026 | Added partial availability to the first Date Decision reply, with whole-window and per-day counts and a separate RSVP after Date Lock-In. |
| 0.16 | November 20, 2026 | Date Lock-In resends the standard fixed-date RSVP invitation through the Planner’s usual sharing flow using the original group link. |
| 0.17 | November 21, 2026 | Added one-tap **Request to follow** from a private email, the signed-in and signed-out group-link journeys, and account-free personal RSVPs. |
| 0.18 | November 21, 2026 | Made one-tap, contact-based Crew invitations the primary flow. Specified private SMS/email cards, the group-link alternative, Planner-only contact details, delivery recovery, and the fixed-date resend to eligible Crew. |
