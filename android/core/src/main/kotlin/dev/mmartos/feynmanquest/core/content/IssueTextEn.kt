package dev.mmartos.feynmanquest.core.content

import dev.mmartos.feynmanquest.core.engine.Issue
import dev.mmartos.feynmanquest.core.engine.IssueCode

/** Port of src/content/en/issues.ts. */
private val SPECIES = mapOf("e-" to "an electron (e⁻)", "e+" to "a positron (e⁺)", "gamma" to "a photon (γ)", "?" to "something else")
private val CHANNEL = mapOf(
  "s" to "s channel (the initial particles meet at a vertex)",
  "t" to "t channel (each particle keeps its “side”)",
  "u" to "u channel (the lines cross)",
  "?" to "another kind",
)

internal fun issueTextEn(i: Issue): IssueText = when (i.code) {
  IssueCode.EXTERNAL_UNCONNECTED -> IssueText(
    "A connection is missing",
    "There's an external particle with no line. Every particle coming in and going out must take part in the diagram.",
  )
  IssueCode.EXTERNAL_OVERCONNECTED -> IssueText(
    "Too many lines",
    "Each external particle is drawn as a single line that reaches a vertex.",
  )
  IssueCode.EXTERNAL_TO_EXTERNAL -> IssueText(
    "A line that doesn't interact",
    "You've joined two external particles directly. Without a vertex there's no interaction: lines must meet at a vertex.",
  )
  IssueCode.SELF_LOOP -> IssueText("Line in a loop", "In this campaign a line can't start and end at the same point.")
  IssueCode.VERTEX_UNUSED -> IssueText(
    "Empty vertex",
    "There's an unused vertex. In this challenge every vertex must be part of the diagram.",
  )
  IssueCode.VERTEX_DEGREE -> IssueText(
    "Vertex with ${i.int("degree") ?: "?"} lines",
    "A fundamental QED vertex joins exactly three lines: two fermion lines (one arrow in and one out) and a photon.",
  )
  IssueCode.VERTEX_PHOTON_COUNT -> if (i.int("photons") == 0) IssueText(
    "Vertex without a photon",
    "This vertex joins three fermion lines. In QED, the electron interacts by emitting or absorbing a photon: every vertex needs exactly one photon.",
  ) else IssueText(
    "Too many photons at a vertex",
    "A QED vertex has a single photon. The photon has no charge, so two photons can't interact directly at a fundamental vertex.",
  )
  IssueCode.VERTEX_FERMION_FLOW -> IssueText(
    "The arrows don't flow",
    "At this vertex ${if (i.int("arrowsIn") == 0) "no arrow comes in" else "two arrows come in"}. At every vertex one arrow must come in and another go out: it's the visual form of electric charge conservation.",
  )
  IssueCode.DISCONNECTED -> IssueText(
    "Separate parts",
    "The diagram is split into pieces that don't touch. For all the particles to interact, everything must be connected.",
  )
  IssueCode.LOOP -> IssueText(
    "There's a loop",
    "Your diagram contains a closed circuit (a loop). Loops are higher-order corrections; in this challenge we're looking for tree-level diagrams.",
  )
  IssueCode.FURRY -> IssueText(
    "A loop that cancels out",
    "Your electron loop has ${i.str("photons")} ${if (i.int("photons") == 1) "photon" else "photons"} attached: an odd number. By Furry's theorem, this loop and the same path traversed in the opposite direction cancel exactly.",
  )
  IssueCode.EXTERNAL_MISMATCH -> IssueText(
    "Wrong particle",
    "There should be ${SPECIES[i.str("expected")]} there, but your line represents ${SPECIES[i.str("got")]}. Remember: an arrow forward in time is an electron; against time, a positron.",
  )
  IssueCode.CHARGE_NOT_CONSERVED -> IssueText(
    "Charge isn't conserved",
    "The initial charge is ${i.str("initial")} and the final one ${i.str("final")}. No QED process can change the total charge.",
  )
  IssueCode.KINEMATICALLY_FORBIDDEN -> IssueText(
    "Allowed, but not possible",
    "The vertex is correct, but a single-vertex process with real free particles can't conserve energy and momentum at the same time.",
  )
  IssueCode.WRONG_CHANNEL -> IssueText(
    "Valid diagram, but not the one asked for",
    "You've built a ${CHANNEL[i.str("got")]} diagram. The challenge asked for a ${CHANNEL[i.str("expected")]} one.",
  )
  IssueCode.SAME_AS_REFERENCE -> IssueText(
    "It's the same diagram",
    "Even if you draw it differently, it connects the same particles at the same vertices: it's the same contribution. Look for another way to pair up the particles.",
  )
}
