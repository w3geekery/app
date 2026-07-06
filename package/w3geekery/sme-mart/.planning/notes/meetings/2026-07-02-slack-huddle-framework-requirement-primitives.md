# Slack Huddle — Kevin: is "Framework" just a Project and "Requirement" just a Task?

**Date:** 2026-07-02
**Time:** 9:13 AM – 9:31 AM PT
**Source:** Slack Huddle
**Participants:** Clark Stacer, Kevin McCarthy (CIO — platform/Hub)
**Topic:** The "there there" question — do Framework and Requirement need to be distinct primitives, or are they just Project and Task with a purpose?

---

## Headline

Kevin challenged whether the compliance demo's **Framework** and **Requirement** are real primitives or just aliases: "frameworks and structure are the same thing, and requirements and tasks are the same thing — **unless you can answer why they would be different.**" Clark agreed he didn't see a difference either. Kevin then supplied the one thing that *does* make a Requirement different from a Task, and it validated the Requirements-drawer design already in the mocks.

## Kevin's two questions

1. **Why is a Framework not just a Project?** A framework is a *purpose/flavor* of a project. "I have a project to build a deck — is that a framework? No, it's just my project." Is there any logic that says *if framework, then X*, or is it just words that look like frameworks?
2. **Why is a Requirement not just a Task?** "A requirement is just a task type, right? It's either satisfied or not, based on the opinion of the approver/requester." The Requirements tab "has a tasks tab — it's the same thing."

Brian wants to *see* the word framework / requirement product / requirement — but Kevin: "is there a *there* there, or is that just an alias for a project or a task?" If there's no real difference, "let's use the generic project building blocks."

## Kevin's answer — what actually makes a Requirement different (THE key insight)

**A Requirement is different from a Task only because you can MAP it to controls.** Instead of answering the ask directly, you map *how the requirement is satisfied by things in the boundary* — and that mapping tells the system how to **auto-populate the proof task**.

- The mapping is **generic / reusable**, not per-ask. Kevin's analogy: requirement = "maintain a safe workplace environment"; your internal process = "sweep & mop the floors every night." You declare *how you discharge this requirement generically* — the ongoing thing you do — once.
- **Requirement = the generic "how do you discharge this" mapping (requirement → internal control).** **Task = the specific ask/proof instance** ("prove you swept the floor"), which the mapping **informs and auto-populates**.
- **No mapping → it's just a Task.** "Then that's just a task, there is no mapping there — you open the task, it's blank, you type whatever you want."
- **Framework = a Project flavor/purpose.** "Pinning" a framework gives the project properties that match the framework: the structure/hierarchy of requirements is *built from* the framework. Requirements land as **subprojects or the tasks within them.**

## Requirements drawer — CONFIRMED

Clark walked the drawer flow: list of requirements → click one → drawer opens → shows the requirement + any **already-anchored controls for your boundary** → **map a control via crosswalk** (it *suggests* related crosswalks) → you can anchor a different one or browse all controls.

Kevin: **"Yeah, I know, that's right. I think that looks good."** And: **"that's what would make a requirement different, is that right there"** — the anchoring/mapping is the differentiator; the task is the proof of it, and the requirement mapping *informs how that task works.*

## Auto-populated proof tasks (new behavior to reflect)

When the proof task arrives ("prove you're doing this"), because the internal control is already declared+anchored, "**we automatically know what queries to run and what to do with them.**" The task **still exists, still has evidence, still gets reviewed — it's just auto-populated** from what we know about the internal control. Where it lives (evidence-collection board / default / wherever) is secondary — "the requirement isn't the ask; the ask is a Task. The task has data associated with it and responses to the data."

## Decisions

- **Framework ≈ Project (a purpose/flavor).** Not a separate primitive; the only "if framework then…" logic it carries is bringing the requirement hierarchy + the control-mapping capability.
- **Requirement ≈ Task, distinguished by ONE thing: the generic requirement→control mapping** that auto-populates/informs the proof task. An unmapped requirement is literally a blank ad-hoc task.
- **The Requirements tab earns its existence solely as the place you do that generic mapping** (the drawer/anchoring flow — confirmed "looks good").
- **Proof tasks are auto-populated** from the anchored internal control (system knows what queries to run / evidence to pull); still real, still reviewed.

## Action items

- [ ] **Clark → "bounce this through Claude"** (this analysis) and do another mock round that answers Kevin's two questions in the UI. *(In progress — this doc.)*
- [ ] Make the Requirements drawer visibly express: **anchored (generic mapping → auto-populated proof task)** vs **ad-hoc (blank task)**.
- [ ] Show the **requirement-mapping → auto-populated task** linkage in the mocks (the "there there").

## Still open

- Where exactly the auto-populated proof task surfaces (Evidence board vs default board) — Kevin: "wherever/however you do that." Not pinned.
