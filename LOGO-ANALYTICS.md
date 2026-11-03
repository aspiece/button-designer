# Logo usage tracking

Button Designer can count which **built-in** logos people add to a button. No school/team questions, sign-in, student names, emails, custom uploads, design text, or artwork files are included in the event.

## Connect the counters

Tracking is **OFF** until an Umami Cloud website ID is configured.

1. Create or sign into an Umami Cloud account at https://cloud.umami.is/.
2. Add a website with the domain `fentonbuttons.geneseelearninglab.com`.
3. Copy the **Website ID** from its tracking-code settings (a UUID).
4. In `logo-analytics.js`, replace `const UMAMI_WEBSITE_ID = '';` with the Website ID between the quotes.
5. Commit the change to `main`, then open the live designer and add a built-in logo.
6. In Umami, open **Events** → **logo_used** → **Properties**. The **logo** value identifies a specific logo file; **category** separates robotics team, school, and FIRST logos; **color** distinguishes black/orange/white robotics-team variants.

The analytics script disables automatic pageview tracking (`data-auto-pageview="false"`), so it is set up to count only events explicitly sent by Button Designer. The script URL is `https://cloud.umami.is/script.js`.

## What is counted

- One **logo_used** event when a preloaded *Robotics Teams*, *School Logos*, or *FIRST Logos* image has been successfully added as a layer to the current design.
- Different color variations of a robotics team logo share the same `logo` file path and include an optional `color` property.
- Adding the same logo again counts again, because these are **placements**, not unique people or finished buttons.
- Personal uploaded images and `Public Images` artwork are **not** counted.
- Saving, opening, previewing, and exporting PDFs do **not** increase logo counts.
- No event is sent for a failed image import. The legacy team/FIRST dropdowns are instrumented alongside the main gallery.
- Browsers blocking analytics, offline sessions, or usage before connecting Umami cannot be counted. Historic use cannot be recovered.

## Privacy and reporting

This feature intentionally does not identify individual students. Umami still processes anonymous request/session metadata as part of its analytics service. Before enabling third-party analytics for a school audience, review the school's privacy rules and provide appropriate notice.

This report shows **logo placements**, not the number of students who used the app. Team/school branding identifies the logo selected; it does not establish the user's actual school or team.
