# Feynman Quest — Product proposal

**Version:** 0.1  
**Concept:** Hybrid educational game (casual puzzles + advanced particle physics learning)  
**Proposed initial platform:** Mobile, portrait orientation

> **Learn the language of the universe, one interaction at a time.**

## Executive summary

**Feynman Quest** is a particle physics puzzle game that starts out approachable and grows into a Feynman diagram lab. Players learn by doing: first they recognise symbols, then they interpret interactions, and finally they build diagrams, spot mistakes and discover why some processes are possible or impossible.

| Dimension | Proposal |
|---|---|
| Audience | Teenagers from about 14, curious adults and physics students |
| Sessions | Short 2–5 minute challenges |
| Core mechanics | Decode, Build and Debug |
| First campaign | 24 levels across five chapters |
| Progression | From visual recognition to interpreting and building diagrams |
| Depth | Intuitive, scientific and optional mathematical layers |

## 1. Core game loop

Each level presents a small scientific mystery. The player interacts with a diagram, solves the challenge and gets a visual explanation of what they have just discovered.

1. **Observe:** What is happening in this diagram?
2. **Experiment:** Select, connect or modify particles.
3. **Understand:** Find out why your solution works or fails.
4. **Progress:** Unlock new interactions and challenges.

The goal is for learning to happen through meaningful actions, not just by answering quizzes.

### 1.1 Decode — Decode the diagram

The player is given a diagram and must interpret it: identify particles, tell internal lines from external ones, count interactions or work out which process it represents.

**Example:** "Which particle is exchanged between these two electrons?"

### 1.2 Build — Build the interaction

The player is given the initial and final particles and must connect them with vertices and lines that follow the rules of the theory.

**Example:** "Build a non-zero first-order diagram for the scattering of two electrons."

### 1.3 Debug — Find the mistake

The player is shown a diagram with a physics or notation problem. They must find and fix it, learning from the validation engine's explanation.

**Example:** "This QED vertex connects two electrons and two photons. What is wrong with it as a fundamental vertex?"

The three mechanics alternate and combine across chapters so the experience doesn't become a multiple-choice test.

## 2. One game, three levels of depth

Instead of splitting the game into easy and hard versions, every challenge offers three layers of explanation:

### 2.1 Intuitive

**Question:** "What am I looking at?"

**Example explanation:** "Two electrons interact electromagnetically. The diagram shows one contribution to that interaction, through the exchange of a virtual photon."

### 2.2 Scientific

**Question:** "What does it mean physically?"

**Example explanation:** "It is a tree-level electron–electron (Møller) scattering diagram. It has two QED vertices connected by an internal photon propagator."

### 2.3 Mathematical (optional)

**Question:** "How is it written mathematically?"

**Example explanation:** "Each QED vertex contributes a factor proportional to `e`. With two vertices, the amplitude is of order `e²`. To compute the full scattering amplitude for identical electrons at that order, the relevant diagrams must be combined with the right signs."

The mathematical layer would unlock gradually and **would not block the main campaign**.

## 3. Learning progression: a 24-level campaign

| Chapter | Levels | Name | Learning goals |
|---|---:|---|---|
| 1 | 1–5 | **The quantum alphabet** | Recognise lines, arrows, electrons, positrons and photons. Understand that the drawing is not a literal trajectory. |
| 2 | 6–10 | **The rules of interaction** | Discover QED vertices, charge conservation and allowed connections. Tell an admissible vertex from a complete, physically possible process. |
| 3 | 11–16 | **Particles that interact** | Combine two vertices, interpret photon exchanges and tell internal lines from external ones. |
| 4 | 17–20 | **Many possibilities** | Recognise topologically equivalent drawings and distinct contributions to the same process. |
| 5 | 21–24 | **The final challenge** | Interpret, build and justify solutions without step-by-step instructions. |

### Advanced content after the MVP

- **Loop diagrams:** self-energy corrections, vacuum polarization and perturbative orders.
- **Other interactions:** gluons, W/Z bosons, quarks and the Higgs boson.
- **Mathematical mode:** vertex factors, propagators, amplitudes and contributions to a calculation.
- **Sandbox:** draw diagrams freely, experiment and check whether they are valid.

The original image that was shared, with wavy lines and possible corrections, could inspire an advanced challenge once the details needed to read it unambiguously have been added.

## 4. Example of a complete level

### Chapter 3 · Level 12 — "The invisible messenger"

**Type:** Build  
**Goal:** Two electrons come into an interaction and two electrons come out. Complete a diagram exchanging a single virtual photon.

**Proposed layout:** Four external electron lines (`e⁻`), two vertices and an empty space between them. The solution connects both vertices with a wavy virtual photon line (`γ`). The input is shown on the left and the output on the right.

**Play sequence:**

1. The four external lines and two incomplete vertices appear.
2. The player chooses which particle can connect those vertices.
3. They drag the photon into the right space.
4. The system checks the QED rules that apply to the diagram.
5. An animation highlights the lines and explains the role of the virtual photon.

**Success feedback:**

> You have built a valid tree-level contribution to electron scattering. Each vertex connects two fermion lines and one photon line.

**Expected learning:** The player recognises that the virtual photon connects two QED vertices in a contribution to electron–electron scattering.

## 5. Gamification focused on learning

| Element | How it works |
|---|---|
| **Stars** | Up to three per level, based on understanding, mistakes and help used. |
| **XP** | Unlocks chapters and challenges. |
| **Hints** | First they point you in the right direction; then they show the relevant rule. |
| **Mastery** | Repeats difficult concepts with different diagrams. |
| **Collection** | Personal library of discovered particles, concepts and processes. |
| **Final challenges** | Combine the mechanics learned. |

The collection of discoveries lets players revisit concepts through interactive diagrams.

**Design decision:** Avoid mandatory timers at the start; understanding should take priority over speed.

## 6. MVP scope

### Included

- **24 levels**, designed by hand.
- Three mechanics: **Decode**, **Build** and **Debug**.
- **Basic QED**: electrons, positrons and photons.
- Constrained editor with magnetic connections and draggable pieces.
- Deterministic solution validator.
- Scientific explanations and contextual hints.
- Local progress, stars and chapter unlocks.
- Spanish as the initial language, with an architecture ready for localization.

### Out of the MVP

- A fully free editor for arbitrary diagrams.
- Automatic level generation with AI.
- Loops and complex calculations.
- Multiplayer, leaderboards and user accounts.
- The rest of the Standard Model interactions.

**MVP goal:** Validate both that manipulating diagrams is fun and that players genuinely learn the concepts.

## 7. Proposed technical architecture

A first native Android version could be built with **Kotlin + Jetpack Compose**, keeping the physics engine separate from rendering.

```text
┌──────────────────────────────────────────────────┐
│ Game UI                                          │
│ Compose / Canvas · Touch gestures · Animations   │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│ Game Engine                                      │
│ Levels · Progression · Hints · States            │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│ Diagram Engine                                   │
│ Graph · Particles · Vertices · Rules             │
└──────────────────────────────────────────────────┘
```

### Conceptual model

Diagrams are represented as **typed graphs**:

- **Nodes:** interaction vertices and external endpoints.
- **Edges:** particle lines with a type and properties.
- **Validation:** structural comparison and checks of the physical rules.
- **Rendering:** position, curvature, style and animations, independent of the graph's meaning.

The MVP doesn't need to generate or recognise every imaginable diagram. It is enough to validate the intended solutions and their accepted visual variations.

### Three levels of validation

1. **Structural:** lines and vertices are connected correctly.
2. **Theoretical:** each vertex follows the QED rules and the relevant conservation conditions.
3. **Physical/kinematic:** when the level requires it, the complete process is compatible with conservation laws and kinematic conditions.

**Important scientific caveat:** A formally admissible diagram does not automatically guarantee that a process can happen with the proposed external particles. Also, a Feynman diagram represents a contribution to a probability amplitude, **not a photograph of the particles' actual trajectories**. The content should be reviewed by someone trained in particle physics.

## 8. User validation

| Hypothesis | How to measure it |
|---|---|
| It's understandable without prior knowledge | Percentage who complete the first five levels without help. |
| Building diagrams is fun | Percentage who voluntarily start the next level. |
| Real learning happens | Compare short concept tests before and after playing. |
| Difficulty ramps up appropriately | Mistakes and hints used per level. |
| There is interest in going deeper | Voluntary use of the scientific and mathematical explanations. |

**Preliminary design targets, not observed results:**

- At least **75%** of testers complete the tutorial.
- Most testers can interpret a new simple diagram after completing the third chapter.

## 9. References and positioning

There are related tools and games worth studying as references for the product and for scientific rigour:

| Project | What it offers | Link |
|---|---|---|
| **FeynCraft** | Browser game and academic work on creating and validating diagrams. | https://www.alphaxiv.org/abs/2510.14082 |
| **FeynGame** | Editor and game mode for creating and checking diagrams in different models. | https://ippog-resources-portal.web.cern.ch/project-30/ |
| **Tutti Quantum** | Card game and educational tool about particle interactions. | https://epfl-ecal-lab.ch/2022/12/tutti-quantum/ |
| **FeynLab** | Reading, building and validation exercises. | https://diffy.ai/games/feynlab |

**Proposed positioning:** Don't compete mainly on scientific sophistication with these tools, but on a **mobile puzzle experience that is accessible, visually polished and has an excellent learning progression**.

The links are included as references to explore; their status and features should be reviewed before writing a definitive competitive analysis.

## 10. Recommended development plan

### Phase 1 — Interaction prototype

Build a single **Build** level with draggable pieces, validation and visual feedback. Check that manipulating diagrams feels satisfying.

### Phase 2 — Vertical slice

Complete five levels of the first chapter with interface, tutorial, explanations and progression.

### Phase 3 — Reusable engine

Introduce vertex models, graph validation, QED rules and the three game mechanics.

### Phase 4 — MVP

Complete the 24 levels, local saves, sound, accessibility and testing with people without a science background.

## 11. Proposed next deliverable

Write a **Game Design Document (GDD) v1** and the full specification of the **first five levels**, including:

- Screens and components.
- Touch interactions.
- Diagrams and correct solutions.
- Common mistakes.
- Hints and learning texts.
- Animations and feedback effects.
- Success and unlock conditions.

---

**Guiding principle:** *Correctly connecting three lines at a vertex should feel as satisfying as solving a logic puzzle. If the interaction is fun, the physics provides the depth to grow the game without inventing artificial rules.*
