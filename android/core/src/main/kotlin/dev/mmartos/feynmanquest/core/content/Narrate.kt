package dev.mmartos.feynmanquest.core.content

import dev.mmartos.feynmanquest.core.engine.Species
import dev.mmartos.feynmanquest.core.engine.Timeline
import dev.mmartos.feynmanquest.core.engine.VertexEvent
import dev.mmartos.feynmanquest.core.engine.Traversal
import kotlinx.serialization.Serializable

/** One caption of "watch it in time". Ports of src/content/{narrate,es/narrate,ca/narrate,en/narrate}.ts. */
@Serializable
data class Caption(
  val title: String,
  val text: String,
  /** Charge balance at a vertex, e.g. "−1 → −1 + 0". */
  val charge: String? = null,
)

/* ---------- language-neutral pieces (src/content/narrate.ts) ---------- */

private fun cap(s: String) = s.replaceFirstChar { it.uppercaseChar() }
private fun list(xs: List<String>, and: String) = if (xs.size <= 1) xs.joinToString("") else "${xs.dropLast(1).joinToString(", ")} $and ${xs.last()}"
private fun num(q: Int) = if (q < 0) "−${-q}" else if (q > 0) "+$q" else "0"
private fun sum(ts: List<Traversal>): String {
  if (ts.isEmpty()) return "0"
  val qs = ts.map { it.species.charge }
  return (listOf(num(qs[0])) + qs.drop(1).map { q -> if (q < 0) "− ${-q}" else "+ $q" }).joinToString(" ")
}
private fun counts(ts: List<Traversal>): List<Pair<Species, Int>> {
  val m = LinkedHashMap<Species, Int>()
  for (t in ts) m[t.species] = (m[t.species] ?: 0) + 1
  return m.toList()
}
private fun sup(n: Int) = n.toString().map { "⁰¹²³⁴⁵⁶⁷⁸⁹"[it - '0'] }.joinToString("")
private fun numberWord(n: Int, two: String, three: String) = when (n) { 2 -> two; 3 -> three; else -> n.toString() }

/** The sentence patterns each language fills in. */
private interface Grammar {
  fun name(t: Traversal): String
  fun list(xs: List<String>): String
  fun summary(ts: List<Traversal>): String
  fun start(ins: List<Traversal>, positron: Boolean): Caption
  fun end(outs: List<Traversal>, vertices: Int): Caption
  fun vertexTitle(step: Int): String
  fun fromVacuum(outs: String): String
  fun vanish(ins: String): String
  fun emits(f: String, g: String, same: Boolean, out: String): String
  fun absorbs(f: String, g: String, same: Boolean, out: String): String
  fun annihilate(a: String, b: String, g: String): String
  fun pair(g: String, a: String, b: String): String
}

private object Es : Grammar {
  private fun word(s: Species) = when (s) { Species.Electron -> "electrón"; Species.Positron -> "positrón"; Species.Photon -> "fotón" }
  override fun name(t: Traversal) = "un ${word(t.species)}${if (t.virtual) " virtual" else ""}"
  override fun list(xs: List<String>) = list(xs, "y")
  override fun summary(ts: List<Traversal>) = list(counts(ts).map { (s, n) ->
    val base = word(s)
    if (n == 1) "un $base"
    else "${numberWord(n, "dos", "tres")} ${if (base.endsWith("n")) base.replace(Regex("ón$"), "ones") else "${base}s"}"
  })
  override fun start(ins: List<Traversal>, positron: Boolean) = Caption(
    "Al principio",
    if (ins.isNotEmpty()) "Entran ${summary(ins)}.${if (positron) " El positrón avanza en el tiempo como todo lo demás, aunque su flecha apunte hacia atrás." else ""}"
    else "No entra ninguna partícula: todo empieza en el vacío.",
  )
  override fun end(outs: List<Traversal>, vertices: Int) = Caption(
    "Al final",
    "${if (outs.isNotEmpty()) "Salen ${summary(outs)}." else "No sale ninguna partícula."} Con $vertices ${if (vertices == 1) "vértice" else "vértices"}, la amplitud de esta historia es proporcional a e${sup(vertices)}.",
  )
  override fun vertexTitle(step: Int) = "Vértice $step"
  override fun fromVacuum(outs: String) = "Del vacío surgen, por un instante, $outs."
  override fun vanish(ins: String) = "${cap(ins)} se encuentran y desaparecen por completo."
  override fun emits(f: String, g: String, same: Boolean, out: String) = "${cap(f)} emite $g" + if (same) " y sigue su camino." else " y continúa como $out."
  override fun absorbs(f: String, g: String, same: Boolean, out: String) = "${cap(f)} absorbe $g" + if (same) "." else " y continúa como $out."
  override fun annihilate(a: String, b: String, g: String) = "${cap(a)} y $b se aniquilan en $g."
  override fun pair(g: String, a: String, b: String) = "${cap(g)} se convierte en un par: $a y $b."
}

private object Ca : Grammar {
  private fun word(s: Species) = when (s) { Species.Electron -> "electró"; Species.Positron -> "positró"; Species.Photon -> "fotó" }
  private fun plural(s: Species) = when (s) { Species.Electron -> "electrons"; Species.Positron -> "positrons"; Species.Photon -> "fotons" }
  override fun name(t: Traversal) = "un ${word(t.species)}${if (t.virtual) " virtual" else ""}"
  override fun list(xs: List<String>) = list(xs, "i")
  override fun summary(ts: List<Traversal>) = list(counts(ts).map { (s, n) -> if (n == 1) "un ${word(s)}" else "${numberWord(n, "dos", "tres")} ${plural(s)}" })
  override fun start(ins: List<Traversal>, positron: Boolean) = Caption(
    "Al principi",
    if (ins.isNotEmpty()) "${if (ins.size == 1) "Entra" else "Entren"} ${summary(ins)}.${if (positron) " El positró avança en el temps com tota la resta, encara que la seva fletxa apunti cap enrere." else ""}"
    else "No entra cap partícula: tot comença en el buit.",
  )
  override fun end(outs: List<Traversal>, vertices: Int) = Caption(
    "Al final",
    "${if (outs.isNotEmpty()) "${if (outs.size == 1) "Surt" else "Surten"} ${summary(outs)}." else "No surt cap partícula."} Amb $vertices ${if (vertices == 1) "vèrtex" else "vèrtexs"}, l'amplitud d'aquesta història és proporcional a e${sup(vertices)}.",
  )
  override fun vertexTitle(step: Int) = "Vèrtex $step"
  override fun fromVacuum(outs: String) = "Del buit sorgeixen, per un instant, $outs."
  override fun vanish(ins: String) = "${cap(ins)} es troben i desapareixen del tot."
  override fun emits(f: String, g: String, same: Boolean, out: String) = "${cap(f)} emet $g" + if (same) " i continua el seu camí." else " i continua com a $out."
  override fun absorbs(f: String, g: String, same: Boolean, out: String) = "${cap(f)} absorbeix $g" + if (same) "." else " i continua com a $out."
  override fun annihilate(a: String, b: String, g: String) = "${cap(a)} i $b s'anihilen en $g."
  override fun pair(g: String, a: String, b: String) = "${cap(g)} es converteix en un parell: $a i $b."
}

private object En : Grammar {
  private fun word(s: Species) = when (s) { Species.Electron -> "electron"; Species.Positron -> "positron"; Species.Photon -> "photon" }
  private fun article(next: String) = if (next.first() in "aeiou") "an" else "a"
  override fun name(t: Traversal): String {
    val words = "${if (t.virtual) "virtual " else ""}${word(t.species)}"
    return "${article(words)} $words"
  }
  override fun list(xs: List<String>) = list(xs, "and")
  override fun summary(ts: List<Traversal>) = list(counts(ts).map { (s, n) ->
    if (n == 1) "${article(word(s))} ${word(s)}" else "${numberWord(n, "two", "three")} ${word(s)}s"
  })
  override fun start(ins: List<Traversal>, positron: Boolean) = Caption(
    "At the start",
    if (ins.isNotEmpty()) "${cap(summary(ins))} ${if (ins.size == 1) "comes" else "come"} in.${if (positron) " The positron moves forward in time like everything else, even though its arrow points backward." else ""}"
    else "No particle comes in: everything starts in the vacuum.",
  )
  override fun end(outs: List<Traversal>, vertices: Int) = Caption(
    "At the end",
    "${if (outs.isNotEmpty()) "${cap(summary(outs))} ${if (outs.size == 1) "goes" else "go"} out." else "No particle goes out."} With $vertices ${if (vertices == 1) "vertex" else "vertices"}, the amplitude of this story is proportional to e${sup(vertices)}.",
  )
  override fun vertexTitle(step: Int) = "Vertex $step"
  override fun fromVacuum(outs: String) = "Out of the vacuum, for an instant, come $outs."
  override fun vanish(ins: String) = "${cap(ins)} meet and vanish completely."
  override fun emits(f: String, g: String, same: Boolean, out: String) = "${cap(f)} emits $g" + if (same) " and carries on." else " and continues as $out."
  override fun absorbs(f: String, g: String, same: Boolean, out: String) = "${cap(f)} absorbs $g" + if (same) "." else " and continues as $out."
  override fun annihilate(a: String, b: String, g: String) = "${cap(a)} and $b annihilate into $g."
  override fun pair(g: String, a: String, b: String) = "${cap(g)} turns into a pair: $a and $b."
}

private fun grammar(language: Language): Grammar = when (language) {
  Language.Es -> Es
  Language.Ca -> Ca
  Language.En -> En
}

/** Plain-language description of one moment of a diagram read in time. */
fun narrate(tl: Timeline, step: Int, language: Language): Caption {
  val g = grammar(language)
  val vertices = tl.events.size
  if (step <= 0) {
    val ins = tl.traversals.filter { tl.rank[it.start] == 0 }
    return g.start(ins, ins.any { it.species == Species.Positron })
  }
  if (step > vertices) return g.end(tl.traversals.filter { tl.rank[it.end] == vertices + 1 }, vertices)
  val ev: VertexEvent = tl.events[step - 1]
  val fIn = ev.ins.filter { it.species != Species.Photon }
  val gIn = ev.ins.filter { it.species == Species.Photon }
  val fOut = ev.outs.filter { it.species != Species.Photon }
  val gOut = ev.outs.filter { it.species == Species.Photon }
  val text = when {
    ev.ins.isEmpty() -> g.fromVacuum(g.list(ev.outs.map(g::name)))
    ev.outs.isEmpty() -> g.vanish(g.list(ev.ins.map(g::name)))
    fIn.size == 1 && fOut.size == 1 && gOut.size == 1 -> g.emits(g.name(fIn[0]), g.name(gOut[0]), fIn[0].virtual == fOut[0].virtual, g.name(fOut[0]))
    fIn.size == 1 && gIn.size == 1 && fOut.size == 1 -> g.absorbs(g.name(fIn[0]), g.name(gIn[0]), fIn[0].virtual == fOut[0].virtual, g.name(fOut[0]))
    fIn.size == 2 -> g.annihilate(g.name(fIn[0]), g.name(fIn[1]), g.name(gOut[0]))
    else -> g.pair(g.name(gIn[0]), g.name(fOut[0]), g.name(fOut[1]))
  }
  return Caption(g.vertexTitle(step), text, "${sum(ev.ins)} → ${sum(ev.outs)}")
}
