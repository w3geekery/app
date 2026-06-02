# UI Standup — 2026-05-28

**Time:** 8:30 AM – 11:30 AM PT (full timer block; captured conversation segment ~23 min)
**Source:** Teams
**Attendees:** Clark Stacer, Kevin McCarthy

> Note: capture is partial — early segment (0:00–1:19) and later segment (~18:51–23:18) only. There's a gap in the middle that wasn't transcribed.

---

## Segment 1 — Requirements tab + internal controls (0:03–1:19)

**Clark (0:03):** Starting transcription just to capture this — I don't really know what the Requirements tab would look like. Boundary is still the place where requirements are defined. Boundary Manager, so we still use that whole internal controls.

**Kevin (0:25):** Yeah, that's my point. Internal controls are what you *do*, and those seem to be mapped into requirements to discharge — like, talking about discharging a requirement, satisfying a requirement. There's some requirement that is written in terms of a contract or in terms of a framework or something, and if you need to prove that you're doing that, you need to map that requirement to internal controls, which are things that you do in the boundary.

**Clark (0:55):** Okay. So let me, I'm navigating to a boundary just to have some frame of reference here. Right now I have no way to populate this. If we go into Controls — the internal controls page — I don't have any way to populate this right now. Whatever the mechanism is that…

**Kevin (1:19):** Yeah.

---

## Segment 2 — Project anchor boundary vs resource-linked boundaries (18:51–20:33)

**Clark (18:51):** Add or remove, relate. Basically, this is just… Each project has a `project.boundaryId` that might be like the anchor boundary, or, I don't know if there's a term that needs to be — or if we should reserve `project.boundaryId` for a specific type of boundary and then use resource links for any others. Like resource-linked boundaries might be… so you could add new boundaries to a project.

**Kevin (19:27):** I wouldn't. The only boundary that makes sense is when you have a *structural parent* that is a boundary. That means this whole project can never see anything that's not in this boundary. That's the case where you're structurally anchored — if that boundary gets deleted, this project is deleted. Like your feet are sitting on that soil. Versus: I'm a project over here on my island and the boundary is over there on its island; if you blow up those islands, it doesn't blow up me. That's *unstructural* — that's where you can have any. That's the linking side of things.

**Clark (20:00):** Okay. So does it make sense that there would be a nomenclature for an anchor boundary versus a linked one?

**Kevin (20:09):** Yeah — that means you're *inside* it. You are a boundary project, in which case you're never going to link to any other boundary.

**Clark (20:15):** OK.

**Kevin (20:19):** If that project exists inside the boundary, it will never see anything that's not inside the boundary.

**Clark (20:25):** Okay, that helps define that.

---

## Segment 3 — Mocks vs code, next step is API prototypes (20:33–23:18)

**Clark (20:33):** Documents, notes, activities — that's TBD. I have plenty to go on. So at what point do I stop making mockups and at what point do I actually start writing code? Are these mocks close enough to what we need to do for me to actually start writing code? If I can defer Readiness and…

**Kevin (21:05):** There's work for Projects and Boards that is a lot of this. Getting the multi-level — the project hierarchies and project types — is meaningful and gets you a good chunk of this stuff.

**Clark (21:23):** Yeah, I changed that panel to Structure and added a bit more detail so you'd be able to navigate the tree of the structure from the overview page. See members, resource links, tags — oh yeah, details. These are all editable fields. Any property of the project — there won't need to be a project control panel or settings panel. The Details panel will either pop up a dialog or have editable fields right here at the overview level.

**Kevin (22:03):** Yeah. So the next step for me is: take all of these screenshots and turn them into **API prototypes of the backend calls** you need for those things. As pseudo-code. Then we'll map that into… you could do that now, because that's going to give Raghu his task list — these are all the APIs we need.

**Clark (22:26):** Oh, okay. I've been kind of collecting what some of the feature requests for endpoints might be, so this would further define the endpoints I need.

**Kevin (22:36):** Yeah, and back those. Go on a screen-by-screen basis and make sure all the screens you'd want to show have back-end calls defined.

**Clark (22:50):** Pretty much most of them do. There's just a few — like for metrics or whatever. Yeah, okay, that seems clear.

**Kevin (23:12):** Cool.

**Clark (23:13):** Yeah.

**Kevin (23:14):** All right, thank you very much.

**Clark (23:16):** Thank you.

---

## Action items (extracted)

- [ ] **Clark** — Go screen-by-screen through the mockups and document the backend API calls each screen needs, as pseudo-code. Output becomes Raghu's task list.
- [ ] **Clark** — Settle nomenclature for "anchor boundary" (structural parent — project lives inside it, dies with it) vs "linked boundary" (resource link — independent islands). Kevin confirmed the structural rule: a project with a boundary parent can never see anything outside that boundary.
- [ ] **TBD** — Documents, Notes, Activities tabs design.

## Key decisions / clarifications

- **Internal controls = what you do** in the boundary. Requirements (from frameworks/contracts) are *satisfied by* mapping to internal controls.
- **Project ↔ Boundary relationship is bimodal:**
  - *Structural anchor* (single, via `project.boundaryId` or structural parent): project lives inside that boundary and inherits visibility limits — can never see anything outside it. Coupled lifecycle (delete the boundary, the project goes too).
  - *Resource-linked* (zero or many, via ResourceLinks): independent — blowing up either side doesn't blow up the other.
- **No separate Project Settings panel.** The Details panel on the overview will hold editable fields (or open a dialog).
- **The next concrete deliverable is the API contract, not more mocks.** Mocks are close enough; map them to backend calls.
