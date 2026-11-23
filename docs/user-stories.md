# ORIVOIR user stories

**Journey 1 · MVP v1.0 · November 23, 2026**

The 46 MVP stories follow a Planner and their crew from a rough idea to a locked date, a shared itinerary, and a confirmed budget. They cover the free consumer core and the optional Gemini pilot. Planning together includes FLOW-01 through FLOW-03 and CREW-10 in MVP v1.0. Three more stories, PAID-01 to PAID-03, record the paid-link rules for after MVP v1.0 and are counted separately. The bullets under each story are its acceptance criteria. [ORIVOIR Living PRD v0.24, November 23, 2026](prd.md) · [Crew invitations engineering guide](crew-invitations.md)

| Journey | Stories | Source sections in the PRD |
|---|---|---|
| [Launch a Venture](#launch-a-venture) | LAUNCH-01 to 06 | Homepage entry · Creation wizard · Roles and accounts |
| [Join and manage the Crew](#join-and-manage-the-crew) | CREW-01 to 09 | Crew opt-in and sharing · Roles and accounts · Date Lock-In · MVP acceptance checks |
| [Choose a date and confirm attendance](#choose-a-date-and-confirm-attendance) | DATE-01 to 04 | Date Lock-In · Routing and data · MVP acceptance checks |
| [Follow a Venture](#follow-a-venture) | VIEW-01 to 03 | View-only access · Roles and accounts |
| [Build the shared itinerary](#build-the-shared-itinerary) | BOARD-01 to 08 | Plan Board · Venture brief · Suggestions and provider searches · Support and decision lock · Itinerary, time, and booking · Paid booking links |
| [Track the shared budget](#track-the-shared-budget) | BUDGET-01 to 06 | Budget amount and basis · Shared Budget journey · Budget acceptance checks · Ownership and lifecycle |
| [Organize a child Venture](#organize-a-child-venture) | CHILD-01 to 03 | Delegated planning · Child Ventures |
| [Find dinner ideas with Gemini](#find-dinner-ideas-with-gemini) | PILOT-01 to 03 | Plan Board · AI-assisted suggestions · Pilot connection |
| [Planning together](#planning-together) | FLOW-01 to 03, CREW-10 | Planning together · Roles and accounts · Child Ventures |
| [After MVP v1.0 · gated by D17](#after-mvp-v1-0) | PAID-01 to 03 (not counted in the 46) | Paid booking links |

## Launch a Venture

The wizard follows **Set the Scene → Schedule → Crew → Budget & Launch**. The design target is under 90 seconds. Travel-only fields stay out of casual Ventures.

<a id="launch-01"></a>

### LAUNCH-01 · Start with a rough idea

As a Planner, I want to start with a place or a vibe so I can bring people together while the details are still open.

- The illustrated homepage shows **Good things await.** and “Gather your people. Pick a date. Plan something worth looking forward to together.” Below the hero, I see my Ventures or an empty state.
- **Start a Venture** opens **Set the Scene**. I can enter a destination, a spot, or a vibe. The Venture title and broader area are optional.

<a id="launch-02"></a>

### LAUNCH-02 · Use a date I already know

As a Planner who has picked a date, I want to enter it directly so the crew can start planning what to do.

- **Set a date** supports a single day or evening with optional start and end times, as well as a multi-day Venture.
- Launching with fixed dates opens the Plan Board in **planning**. The **Set a date** invitation shows the Venture title, the date or range, and any set times in the Venture time zone. It asks the recipient to RSVP.

<a id="launch-03"></a>

### LAUNCH-03 · Ask the crew to help pick a date

As a Planner with flexible dates, I want to give the crew a window and a deadline so I can compare times people can make.

- **Set for date decision** shows the duration first, then requires an earliest start and latest wrap-up for launch.
- **Opt in by** is required. I can choose 24 hours, 3 days, or a custom deadline. The deadline appears on the invite preview.
- Launching opens the Plan Board in **voting**, with **Review dates** available. The personal card and the group invite both ask for availability.

<a id="launch-04"></a>

### LAUNCH-04 · Set a capacity and a planning headcount

As a Planner, I want to distinguish how many people can opt in from how many I expect to attend so I can plan for people who will never fill out an invite.

- **Max crew opt-ins** counts people who submit their first response through either a personal or group link. Sending six invitations uses zero spots. Leaving the limit blank allows uncapped joining while the join window is open.
- I can separately enter a planning headcount that includes me and people attending without a response. A named roster is optional.

<a id="launch-05"></a>

### LAUNCH-05 · Preview, authenticate, and launch

As a Planner, I want to preview the invitation before signing in so I can decide whether the Venture is ready to share.

- In **Budget & Launch**, I can enter an amount and currency with **Total (Everything included)** or **Per person**, or choose **Skip for now**. With six ready contacts, **Launch & invite 6** is the final action on this screen.
- I can preview the invite while signed out. After entering the email one-time code, I return with the same draft, selected people, delivery choices and preview. Completing sign-in alone never sends an invite.
- With nobody selected, **Launch Venture** creates the Venture. **Share a group link** gives me one forwardable URL for an existing group conversation. Retrying a launch after a network interruption returns to the same Venture.

<a id="launch-06"></a>

### LAUNCH-06 · Choose people from my contacts

As a Planner, I want to choose familiar names and faces from my phone so I can gather my crew as easily as I start a group text.

- In **Crew**, **Choose from contacts** opens my device picker where supported. I select several people in one visit. Only the people and available details I choose are shared. I can always **Add by phone or email**.
- A selected row shows the name, contact photo or initials and one chosen destination. I can change the destination or remove the person. Canceling or declining access retains my previous selections.
- Selecting one person twice gives me one invitation. Two people with the same name and different destinations stay distinct. If a mobile number or email is shared by two people, I can supply a separate route or use the group link.

## Join and manage the Crew

<a id="crew-01"></a>

### CREW-01 · Join from a group link

As an invitee, I want to respond from the link someone sent me so I can join without installing an app or creating an account.

- The link can be forwarded. Its landing page shows the Planner, the Venture details, and the **Opt in by** deadline when one applies.
- While joining is open, I enter a display name and submit availability, including **None of these work**, or an RSVP for a fixed date.
- My first successful submission creates an active Attendee entry and takes one spot. Opening the page or triggering a message preview uses none.

<a id="crew-02"></a>

### CREW-02 · Return to my own response

As an Attendee, I want to return to the response I submitted so I can update it even if someone else has my name.

- Reopening the group link in the same browser restores my Crew entry and shows **Responding as [name]**. My private **Manage my response** link restores access on another device.
- Two people with the same display name can join separately. Editing requires the matching private credential and is limited to that member’s own responses and eligible support votes.
- An active membership has one current availability response and one current RSVP. Editing a response keeps the same spot.

<a id="crew-03"></a>

### CREW-03 · Become a Collaborator using my existing entry

As an Attendee, I want to become a Collaborator so I can suggest ideas or organize a side plan and keep the responses I already gave.

- I sign in or create an account by email one-time code. Linking to my Crew entry requires both the verified account and that entry’s private response credential.
- After linking, I keep my Crew entry, spot, availability, RSVP, and support votes. The private credential restores response access across devices. Collaborator actions require the linked account.

<a id="crew-04"></a>

### CREW-04 · Know whether I got the last spot

As an invitee responding to a nearly full Venture, I want to know whether I got the last spot so I can make plans accordingly.

- With five active members and six spots, simultaneous first submissions from a personal and a group link produce exactly one new member with one response. The other submission gets the departure screen.
- A new visitor to a full Venture sees **This Venture has departed. All [limit] spots are filled.**
- Filling the last spot leaves date selection with the Planner. Existing members can still edit availability while voting is open and return to RSVP after Date Lock-In.

<a id="crew-05"></a>

### CREW-05 · Manage the people who actually joined

As a Planner, I want to see the active Crew and manage capacity so the roster and date results reflect the people taking part.

- **Who** shows joined members and capacity, such as **5 of 6 spots filled**. Named invitations awaiting a response are listed separately. I can compare actual opt-ins with the planning headcount and raise the opt-in limit.
- **Remove from Crew** revokes that member’s personal invitation and private response access, excludes their responses from active counts and availability overlap, and removes them from future direct sends.
- Raising the limit or removing a member makes room for a new opt-in while joining is open. A removed person who still has the shared link can submit a fresh opt-in during that window.

<a id="crew-06"></a>

### CREW-06 · Say which days I can join

As an invitee, I want to tell the Planner which days I can come so they can include me when I can join for only part of a Venture.

- On my first availability reply, I can tap any whole window once. **I can join for part** opens the dates within a multi-day option. I can choose Saturday only, or Friday and Sunday, in the Venture time zone. Selecting all days counts as choosing the whole window.
- I can offer the whole first weekend and just Saturday of the second in a single submission. I get one Crew entry and one spot. A response of **None of these work** clears my selections across all windows.
- While voting is open, I can use my private response access to change the days I offered. The Planner sees my latest answer.

<a id="crew-07"></a>

### CREW-07 · Answer my personal invitation

As an invited Attendee, I want the card to recognize my invitation so I can tell the Planner when I can come without creating an account.

- My text or email names the Planner and Venture. My personal link opens in my browser and asks for availability or an RSVP according to the current schedule. I can answer without entering a name, typing a code or installing an app.
- Opening the card or generating a message preview takes no spot. My first accepted answer claims one Crew entry. Reopening or receiving an updated card lets me respond on the same entry. Personal links identify invitations and can be forwarded.
- The ordinary open, full, cutoff and early-lock rules apply. My invitation cannot grant me access to someone else’s entry by a matching name or sign me into a Viewer or Collaborator account.

<a id="crew-08"></a>

### CREW-08 · Send the selected Crew their own cards in one tap

As a Planner, I want to tap once to send each person a personal card so I do not have to open a separate text or email for everyone.

- I review the names and one eligible SMS or email destination for each person. The final action counts ready recipients. A missing or unavailable route shows **Add email** or **Share personal invite** on the affected row. If none are ready, **Launch Venture** can save them for later and give me the group link.
- One tap queues one separate message for each ready recipient. Each message identifies me and links to that recipient’s invitation for this Venture. **Send N invites** also works for people I add after launch.
- With five successes and one failure, I see the affected person and can retry just that delivery. A double tap, refreshed page or repeated delivery receipt preserves the original invitations. A provider-accepted message can still be awaiting an RSVP.

<a id="crew-09"></a>

### CREW-09 · Recognize each person’s reply

As a Planner, I want familiar names and photos beside the answers so I can see at a glance who is available and who is coming.

- My view shows my saved name and photo, or initials, beside the person’s latest answer. I can open the row to see the chosen number or email. For example, **Mom · Saturday works** becomes **Mom · Going** when she confirms the locked date.
- Other Crew members see only a name and photo the invitee chooses to share within their access. The Planner’s address-book nickname, photo and contact details stay out of shared cards, Viewer data and analytics.
- Each named invitation can show **Awaiting reply**. The forwardable group link has no list of intended recipients. Availability, attendance and delivery have separate statuses and counts.

## Choose a date and confirm attendance

<a id="date-01"></a>

### DATE-01 · See where availability overlaps

As a Planner, I want to see who responded and which windows work for them so I can choose a time that fits the crew.

- Live response pills and a countdown show who answered and how much time remains. A dual-layer heatmap shows overlap across candidate windows and highlights matches to the preferred duration when one was set.
- Only successful opt-ins appear on the response roster. **None of these work** counts as a submitted response with no matching window. A pending response is distinguishable from that answer.
- For each candidate window, each person counts once as available for all or part. Four whole-weekend replies plus one Saturday-only reply show **4 for the whole weekend · 1 for Saturday only**. Saturday has five people available.
- While voting is open, edits replace earlier answers. If the Saturday-only respondent switches to the full weekend, I see five whole and zero partial.

<a id="date-02"></a>

### DATE-02 · Resolve an inconclusive vote

As a Planner, I want to review the results or give the crew another chance to respond so a tie or a missed deadline still leaves me a way forward.

- At cutoff, the server closes availability submissions and the workspace retains the results. A stale voting tab cannot record a late answer.
- Someone who never responded and opens the Venture after the cutoff sees the departure screen with **Nothing ventured, nothing gained…**, unless the Venture filled first.
- With zero replies, partial replies, or a tie, date selection remains pending until I lock a time. Before locking, I can move the cutoff forward to reopen voting and permit new joins where capacity allows.
- If everyone answers without a clear match, I can lock a partial match or revise the choices and reopen voting. Revised choices prompt a fresh response.

<a id="date-03"></a>

### DATE-03 · Lock the time I choose

As a Planner, I want one explicit action to lock a window so everyone can move on to planning around the same date.

- **Lock this time** saves the chosen window and moves the Venture to **planning** together. The existing board maps its outline onto the locked dates.
- After a successful lock, the usual fixed-date flow prepares the same **Set a date** RSVP card and notification text. **Send date to N** sends in one action to active Crew with a permitted direct route and preserves each recipient’s existing entry. I can also **Share a group link** using the original group URL.
- An unjoined or removed person is excluded from the direct resend. Dismissing the send or retrying a failed delivery leaves the date locked and the card available to send later.
- An early lock immediately closes availability and new opt-ins. Submitting from a stale tab shows the current phase. Reopening the invite also loads the current state.
- After an early lock, someone who never responded sees the departure screen with **This Venture has departed.**

<a id="date-04"></a>

### DATE-04 · RSVP to the actual date

As an opted-in Attendee or Collaborator, I want to see the time the Planner chose and confirm whether I can come so the crew has an accurate attendance count.

- I can open the original invite or the resent fixed-date card. With my private response access restored, I see the locked schedule and the usual **Count me in** or **Can’t make it** actions. My RSVP updates my existing Crew entry.
- The Planner sees confirmed, declined, and pending attendance. My RSVP stays pending after a whole-window or partial availability reply until I answer for the locked date. Availability and attendance totals remain distinct.
- If I joined via the group link, I can choose **Text me when [Planner] picks a date** after submitting availability. I can continue through my original link and private response access if I skip the offer or withdraw that permission.

## Follow a Venture

<a id="view-01"></a>

### VIEW-01 · Request access after joining closes

As a visitor who missed the join window, I want to ask to follow the Venture so I can still see the plans the Planner chooses to share.

- When capacity is full, or Date Decision joining has closed at cutoff or early lock, I see the departure screen and **Request to follow**, even if I previously opened an invitation. Its message depends on how joining closed ([CREW-04](#crew-04), [DATE-02](#date-02), [DATE-03](#date-03)).
- From a group link, I can request directly if signed in. If signed out, I enter my email and tap **Request to follow** in the private email to sign in or create my account and submit the original request. A direct Viewer invitation takes me to that same action.
- An email preview leaves the private link usable. An intentional tap shows **Request sent** and repeating it creates at most one pending request. Following takes no Crew spot or RSVP and requires the Planner’s approval for access.

<a id="view-02"></a>

### VIEW-02 · Decide who may follow

As a Planner, I want to review and revoke Viewer access so I control who can read the shared plan.

- I can approve or decline a pending request. Approval grants access to that signed-in account. A declined request grants no access.
- Revoking approval removes the Venture from that account’s **Following** list and denies future reads, including through a previously saved direct link.

<a id="view-03"></a>

### VIEW-03 · Read the shared plan across devices

As an approved Viewer, I want to find the Venture when I sign in on another device so I can follow along without asking for another invitation.

- **My Ventures → Following** lists the approved Venture on any device signed in to my account.
- I can read the shared plan. Home addresses, their coordinates and minors’ details are redacted before the data reaches my device, and I see no map for a redacted address. The crew’s Venture brief isn’t included. Viewer access is read-only and gives no permission to vote, generate ideas, or post suggestions.

## Build the shared itinerary

<a id="board-01"></a>

### BOARD-01 · Give the crew a decision to make

As a Planner, I want to open a decision such as Saturday dinner so the crew has one place to suggest options for it.

- The board accepts unscheduled ideas and relative days before date lock. It builds calendar days from the locked dates in the Venture time zone. A one-day Venture opens its day by default. Collapsed days show open and decided counts.
- I can add a decision to a day or to **Whole Venture**, the PRD’s label for decisions spanning days. A title is enough. A time window, spending limit, and note are optional.
- The decision shows **Suggest an idea** to the Planner and signed-in Collaborators.
- A board with no decisions offers starters chosen by the Venture’s length: **A place to stay** when it includes at least one night, **Where to eat** and **Something to do**. Tapping one opens the matching decision card with an editable title. Nothing is added until I tap, and the starters disappear once the board has a decision.
- A must-do I already know goes on the board as a decision card, even before it has options.

<a id="board-02"></a>

### BOARD-02 · Bring an idea to a decision

As a Collaborator, I want to suggest a place by name or with a link I already have so the crew can compare it with other ideas.

- The Planner and signed-in Collaborators use one editable **Add Idea** form for manual entry, a provider link, or supported provider JSON. Recognized fields populate the form. An unfamiliar link can still be saved as the source.
- Only the title is required. An option can carry a note, place, source URL, proposed time, and estimated cost with currency and basis.
- Each decision has one horizontally scrolling carousel of options. A proposed time and quoted price belong to the option they describe.

<a id="board-03"></a>

### BOARD-03 · Search with the plan’s existing constraints

As a Collaborator looking for dinner, I want to use the date and spending limit already on the decision so I can find places that fit without asking the crew again.

- The decision carries forward applicable dates and limits from Date Lock-In and Budget. A whole-Venture target provides context until a decision-specific spending limit is set.
- Dinner starts with provider links such as OpenTable. Where the provider supports date or budget constraints they are passed through. Otherwise, available comparison data can be used to rank or flag results.

<a id="board-04"></a>

### BOARD-04 · Support any options I would enjoy

As an Attendee, I want to give or withdraw a 👍 on several options so I can tell the Planner what I like while keeping my attendance answer separate.

- Planners, Collaborators, and Attendees can toggle their own support on any number of options open for voting. An Attendee can do this through private response access without an account.
- Turning a toggle off withdraws that person’s support. An unchecked option carries no signal. Support counts update independently of RSVP.

<a id="board-05"></a>

### BOARD-05 · Put one choice on the itinerary

As a Planner, I want to lock an option right where the crew discussed it so the decision becomes part of the day’s plan in one action.

- **Lock this option** is available even with zero votes. The chosen option moves first in its existing carousel, gains **Locked in**, and puts the same decision card and its details on the itinerary immediately.
- Other options remain in the carousel. Support can still change on every option open for voting, including the locked choice. Changing support leaves the selection and its position intact.
- If I explicitly lock a different option, it moves first and the itinerary updates to that choice.

<a id="board-06"></a>

### BOARD-06 · Keep time, place, and booking details with the choice

As a Planner, I want the itinerary card to carry the details of the option I chose so the crew can find it and I can track any reservation.

- The card shows the exact time if known, otherwise the existing window, then **Time TBD** if neither exists. I can add or edit the exact time on the card.
- The location appears as text with **Open in Maps**. With coordinates, **Show map** opens a map with the pin. Nothing map-related loads until someone taps **Show map** or **Drop a pin**.
- When the provider gave no coordinates, **Drop a pin** opens the map so I can place the pin or confirm where it sits. ORIVOIR calls a geocoder only if neither the provider nor I set a location, and the option records whether its coordinates came from the provider, my pin or the geocoder.
- A Viewer sees no map or coordinates for a redacted home address.
- I can mark the option **Booked** on the card. I handle reservations and cancellations with the provider. Switching away from a booked option gives me one reminder to check that reservation. The booking status stays with its original option.

<a id="board-07"></a>

### BOARD-07 · Open the booking page from the plan

As a Planner, I want to open a locked option’s provider page from the plan so I can book it.

- The locked option’s source link opens the provider’s page.
- Opening it records one click-out event for pilot measurement (D15) with only the option ID, the decision kind, my member or account ID, and the time. Nothing else changes: RSVP, support and **Booked** stay as they were.
- Collaborators and Attendees can open it too.

<a id="board-08"></a>

### BOARD-08 · Tell the crew what this Venture is about

As a Planner, I want a short brief at the top of the Plan Board so everyone suggesting ideas knows the feel and what to avoid.

- The brief has three optional fields: **What should it feel like?**, **Anything to avoid?** and **Notes for the crew**. The form tells me the crew will see what I write.
- Only I can edit it. Collaborators and Attendees see it at the top of the Plan Board. Viewers never receive it, and it never appears on invite cards, group cards, link previews, emails or texts.
- When the brief is empty, I see **Add a brief** and the crew sees nothing.
- The print one-sheet shows the feel line.
- If I import a Venture planned in this browser before the Plan Board existed, its earlier answers fill a draft brief that only I see until I tap **Share with crew**.

## Track the shared budget

<a id="budget-01"></a>

### BUDGET-01 · Keep the target I entered

As a Planner, I want the budget to remember the amount and basis I chose so the crew can still tell what I meant when the headcount changes.

- A new or edited target preserves its amount, currency, and basis. The planning header shows, for example, **$150 per person** or **$600 total**. An older Venture with only a saved total displays that total and can be edited to use a per-person basis.
- Skipping the target shows **+Set budget**. Every header state opens the Budget view, where I can set or edit the target. The Venture can select and confirm costs while the target is unset.

<a id="budget-02"></a>

### BUDGET-02 · See the cost of switching options

As a Planner, I want to see how much a different choice adds or saves before I lock it so I can weigh the difference against our target.

- Option cards show price and basis when known. An included option’s estimated cost enters the running total when selected. Unselected suggestions stay outside the total.
- Replacing a $360 cabin with a $480 cabin previews **Adds $120 to the plan**. After selection the budget counts the $480 cabin once and removes the $360 cost.

<a id="budget-03"></a>

### BUDGET-03 · Price the right number of people

As a Planner, I want estimates to follow my planning headcount and bookings to retain their actual quantities so I can see who is covered.

- The Budget view shows the planning headcount from **Who**. Changing it recalculates the group target for a per-person budget and estimates that use the default quantity. Fixed totals and the saved per-person target retain their values.
- I can override a line quantity, such as four tickets for a crew of six. A headcount change preserves an overridden quantity and a confirmed booking’s recorded price and booked quantity.
- If I expected six people to participate and have four booked tickets, I see **4 tickets confirmed** and the two-ticket gap.

<a id="budget-04"></a>

### BUDGET-04 · Distinguish a confirmed price, a free item, and an unknown cost

As a Planner, I want each selected cost to show what we actually know so I can see the running total and what still needs a price.

- Confirming an agreed or booked amount replaces that item’s estimate exactly once.
- A selected item with an unknown price shows **Cost TBD**. An item explicitly marked **Free** contributes $0.
- If known costs already exceed the target, the view shows the amount over target even while other costs are pending.

<a id="budget-05"></a>

### BUDGET-05 · Understand what the total and average cover

As a crew member, I want to see which costs we agreed to include so I can interpret the per-person average even when we pay separately.

- Selected costs the crew includes count regardless of who pays. Other tracked costs, such as individually arranged transit, appear separately and stay outside the rollup and average.
- The rollup shows its scope and the planning headcount used. The **average per person** divides the included amount by that count. Individual costs can differ.
- Child costs are tracked in the child Venture. The main Planner can include an agreed child cost through a linked entry that follows updates and counts once in the main budget.

<a id="budget-06"></a>

### BUDGET-06 · See when all selected costs are confirmed

As a Planner, I want the budget to show when every included cost is confirmed so I can share a settled total without doing a separate finalization step.

- While costs are outstanding, the crew sees the running cost, confirmed portion, and outstanding **Cost TBD** items.
- When every included selected cost is confirmed, the view automatically shows **All selected costs confirmed** and the confirmed total.

**Acceptance example for the cabin weekend.** The header reads **$150 per person** throughout.

| Planning headcount | Included choices | Group target | What the crew sees |
|---|---|---|---|
| 4 | $360 cabin, $25 activity per person, dinner TBD | $600 | $460 known, dinner still TBD |
| 6 | Same choices with the default activity quantity | $900 | $510 known, dinner still TBD |
| 6 | Cabin confirmed at $390, activity at $150, dinner at $180 | $900 | $720 confirmed, $120 average per person |

## Organize a child Venture

A regular Plan Board card is enough when an activity needs a headcount or a point person. A child Venture gives a subgroup its own Planner, invitations, and RSVPs.

<a id="child-01"></a>

### CHILD-01 · Start a side plan for part of the crew

As a Collaborator, I want to organize a side plan from the main Plan Board so I can take responsibility for an activity that only some of us want to do.

- As a signed-in Collaborator linked to an active main Crew entry, I can start a child Venture with a title. I become its Planner and own its schedule, choices, invitations, and RSVPs.
- The child uses the main Venture’s dates, time zone, and broad location as context. I can enter a settled plan directly or use the date and option decision flows. Use the parent window while dates are open. Review child placement against the locked parent dates before displaying it on the itinerary.
- A child links to one main Venture. Nesting ends at that level.

<a id="child-02"></a>

### CHILD-02 · Invite a subgroup and count its RSVPs

As a child Planner, I want to invite just the main Crew members interested in my activity so I can coordinate with the people who intend to come.

- I choose invitees only from the main Crew. I can launch to that subgroup before the main Planner approves itinerary placement. Those invitees can use their personal links.
- RSVPs belong to their respective Ventures. If six people confirm for a cabin weekend and four join kayaking, the main Venture still shows six and kayaking shows four.

<a id="child-03"></a>

### CHILD-03 · Add an approved side plan to the main itinerary

As the main Planner, I want to approve a linked summary of a side plan so everyone can see where it fits and its organizer can keep it current.

- The child Planner can request inclusion. On approval, the shared itinerary shows an optional plan summary linking to the child Venture. Child participants and the main Planner have access to child details according to their permissions.
- Changes to the child’s time, meeting point, or cancellation flow through to the shared entry. Moving kayaking from 10 a.m. to 11 a.m. updates the main itinerary.
- If the main dates change, the child Planner is prompted to review the schedule. The child entry is withheld from the updated itinerary until its dates fit.

## Find dinner ideas with Gemini

These stories describe the optional Gemini pilot for an open venue decision.

<a id="pilot-01"></a>

### PILOT-01 · Control who can use my Gemini connection

As a Planner, I want to control whether Collaborators can use my Gemini connection and see the requests against it so I can manage my project’s quota.

- Only the Planner enters a Gemini Developer API key. Credentials stay server-side. Requests use the connected API project’s quota and billing.
- Collaborator generation is off by default. The Planner can enable or revoke it per Venture, set a request limit, and see usage.

<a id="pilot-02"></a>

### PILOT-02 · Generate private dinner ideas inside the Plan Board

As a Collaborator whom the Planner has enabled, I want dinner ideas that fit the plan so I can review them before suggesting anything to the crew.

- On an open venue decision, **Find dinner ideas** works for the connected Planner or an enabled, signed-in Collaborator, including one whose RSVP is pending.
- ORIVOIR sends the locked date and time, broad area, known budget, and preferences the requester adds. The preferences field starts with the [Venture brief](#board-08)’s feel and avoid lines, and the requester can edit or clear it before sending. Automatically included context excludes Crew names, contact details, private addresses and their coordinates, minors’ details, and invite links.
- ORIVOIR validates the provider’s JSON against the expected schema before showing private draft cards to the requester. Each card gives the name, location, reason it fits, and details to check.

<a id="pilot-03"></a>

### PILOT-03 · Choose which ideas reach the crew

As the person who requested ideas, I want to edit and share only the ones I would suggest myself so the crew sees choices worth discussing.

- A draft stays private until I choose **Suggest to crew**. A shared idea uses the same support and lock-to-itinerary flow as a manual suggestion. Generating or sharing leaves RSVP status intact.
- An unavailable provider, exhausted quota, or invalid response produces an actionable message and creates no board cards. Manual entry remains available, including for Ventures with no provider connection.

## Planning together

Required for MVP v1.0. FLOW-02 closes in M5, FLOW-01 in M6, and FLOW-03 and CREW-10 in M8.

<a id="flow-01"></a>

### FLOW-01 · Compare whole plans on one board

As a Planner, I want to explore different versions of the same Venture while the Crew considers dates.

- Start with one working plan. Add an idea or link before inviting anyone. Suggest another plan creates an alternative in the same Venture with its own outline, duration, estimates and support. A title is enough to start.
- Compare a potluck and a picnic, or two multi-day outlines. Show relevant known details, estimated costs as estimates, and the names behind support counts to eligible Crew. A guest can support several alternatives with private access.
- Choose this plan selects one outline and retains the others under Other plans. Selecting a plan and locking dates work in either order. Selecting a plan preserves availability, memberships and RSVP. Only the selected plan feeds the active itinerary and budget.
- Undated ideas and relative days survive date lock. Map Day 1 to the start in Venture time; flag days outside the selected window for review. Retain their ideas. If a proposed date or duration changes, mark earlier support for reconfirmation.

<a id="flow-02"></a>

### FLOW-02 · Show each person the next useful action

As a Crew member, I want to know what the group is deciding and when I have finished my part.

- Show duration first, followed by a fixed date or bounded candidate window. With multiple durations show each on its proposal. An invite for one evening asks which evenings work, and a multi-night invite shows whole stays and partial availability.
- Show one primary action for the current person. The Planner can use Ask the Crew on an open decision to feature it. The board keeps the date summary and other ideas accessible.
- A returning member sees their recorded answer and the current question. An expression of interest, support, availability and a final RSVP convey distinct commitments. A changed locked schedule requests a fresh RSVP from existing members.

<a id="flow-03"></a>

### FLOW-03 · Keep the contribution through account creation

As a guest, I want to take my next action without losing the response or idea I already entered.

- Guest availability, RSVP and support work before sign-in. Confirm the saved response and offer private return access plus an optional Save to My Ventures.
- Let a guest draft a suggestion or side plan. Ask for sign-in or account creation at sharing or organizing. Restore the draft on cancellation; after verification and private membership proof, complete the intended action once, even on retry.
- Saving a Venture links the same membership. Posting or organizing uses Collaborator permissions. Keep the original spot, answers and support. From a completed Venture, a guest can also draft a new Venture and sign in at launch.

<a id="crew-10"></a>

### CREW-10 · Invite people from a shared Venture again

As a participant, I want to invite people I met on a particular Venture to another gathering.

- After the gathering, offer Let this Crew invite me again. A guest can create an account to save that connection. Record a revocable choice for this specific Crew. Participation or a prior RSVP alone grants no invitation permission.
- From Invite Crew → Past Crew choose the previous gathering, select individual eligible people, and review the count. A child Venture has its own Past Crew and consent. Parent membership gives no access to its subgroup roster.
- Plan something together again starts a fresh draft from a completed Venture, with eligible people available for selection. Send only on the Planner’s explicit action. Each recipient gets a fresh invitation and chooses whether to join.
- Resolve eligible people by linked identity and recheck permission at send. Dedupe recipients across sources. Keep contact details private, honor withdrawal or blocking and never copy answers or memberships into the new Venture.

## Decisions still open

| Area | Where v0.24 leaves the decision |
|---|---|
| Availability windows | Decide how to generate candidates from the Planner’s target range and ideal length, and how a guest enters part of an evening. Editable Friday–Sunday suggestions are an option under consideration. |
| Post-lock guest visibility | Opted-in members can see the chosen time, RSVP, and support eligible options. The full set of details visible to an opted-in guest and how to confirm previously offered days are still open. |
| Rescheduling | A child plan affected by changed main dates has a review rule. The general rules for existing invitations and attendance when a locked date changes are still open. |
| Direct delivery | Select providers and supported destinations. Enable the first SMS invitation and date updates only where ORIVOIR meets the chosen sender and permission requirements. |
| Transit | Chained Plane, Car, Ship/Cruise, and Train/Bus legs and the 90-minute Shared Transfer Window remain in ideation. |
| Provider expansion | Deeper provider integrations depend on supported access. Easier AI setup, additional providers, and extending suggestions to lodging or activities are future work. |
| Paid links | When to turn them on (D17), the route (D18), links people paste (D19) and the payee (D20) are open in the [implementation plan](implementation-plan.md#4-decisions-needed). |

**Icebox.** The PRD parks *Roll the dice for a date* for later consideration.

<a id="after-mvp-v1-0"></a>

## After MVP v1.0 · gated by D17

These stories record the rules in [Paid booking links](prd.md#paid-booking-links). They are outside MVP v1.0 and outside the count of 46. Build them only after Dot turns paid links on (D17). PAID-03 follows the D19 recommendation. If Dot decides D19 differently, update it in the same change.

<a id="paid-01"></a>

### PAID-01 · Know when a link pays ORIVOIR

As a crew member, I want to know when ORIVOIR earns a commission from a link so I can decide how to book with that in mind.

- A paid link appears only as the booking link on an option in a Plan Board decision for lodging (**A place to stay**) or an activity. Invite cards, group cards, Date Decision, Viewer emails and every message ORIVOIR sends carry no paid link.
- Every option card with a paid link shows a plain label next to the link, such as “Paid link · ORIVOIR earns a commission if you book through it.” The label never says “affiliate link” on its own. The print one-sheet shows the same label beside the same link.
- A paid link’s tracking parameters carry only an opaque click ID, with no names, emails, phone numbers, Venture titles, dates or destination text. The privacy policy names every commission partner.

<a id="paid-02"></a>

### PAID-02 · Trust the order of ideas

As a crew member, I want ideas ordered by what the crew chooses, not by what pays ORIVOIR, so the plan reflects our decisions.

- A paid link never changes the carousel order, support counts, the locked choice, or budget math.
- A paid link never changes which provider a search button opens.
- Gemini draft cards ([PILOT-02](#pilot-02)) come out the same whether or not a commission is available. The Gemini prompt never includes commission data.

<a id="paid-03"></a>

### PAID-03 · Keep the link I pasted as I pasted it

As a Planner or Collaborator, I want a link I paste to stay exactly as I pasted it so ORIVOIR never swaps in its own tracking.

- ORIVOIR never rewrites a link a Planner or Collaborator pasted. It opens exactly the URL that was saved, with no parameters added or changed.
- Paid links appear only where ORIVOIR builds the link itself, such as a **Find stays** button on a lodging decision.
- A pasted link never shows the paid-link label, because it never pays ORIVOIR.
