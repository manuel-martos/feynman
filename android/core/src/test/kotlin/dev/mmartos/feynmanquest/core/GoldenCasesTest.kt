package dev.mmartos.feynmanquest.core

import dev.mmartos.feynmanquest.core.content.Caption
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.content.IssueText
import dev.mmartos.feynmanquest.core.content.issueText
import dev.mmartos.feynmanquest.core.content.narrate
import dev.mmartos.feynmanquest.core.engine.Diagram
import dev.mmartos.feynmanquest.core.engine.ExternalSpec
import dev.mmartos.feynmanquest.core.engine.Issue
import dev.mmartos.feynmanquest.core.engine.ValidationOptions
import dev.mmartos.feynmanquest.core.engine.channelOf
import dev.mmartos.feynmanquest.core.engine.couplingOrder
import dev.mmartos.feynmanquest.core.engine.edgeLabel
import dev.mmartos.feynmanquest.core.engine.enumerateTrees
import dev.mmartos.feynmanquest.core.engine.fermionLoops
import dev.mmartos.feynmanquest.core.engine.loopCount
import dev.mmartos.feynmanquest.core.engine.loopEdges
import dev.mmartos.feynmanquest.core.engine.timeline
import dev.mmartos.feynmanquest.core.engine.topologySignature
import dev.mmartos.feynmanquest.core.engine.validate
import java.io.File
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Parity with the TypeScript engine: every case in shared/engine-cases.json was
 * computed by the web engine (scripts/export-shared.ts). The Kotlin port must
 * reproduce validation issues (codes, elements, data and messages), topology,
 * loops, labels, the time ordering and the narration exactly.
 */
class GoldenCasesTest {
  private val json = Content.json
  private val shared = File(System.getProperty("shared.dir") ?: "../../shared")
  private val root = json.parseToJsonElement(File(shared, "engine-cases.json").readText()).jsonObject

  private fun <T> decode(s: kotlinx.serialization.KSerializer<T>, e: JsonElement) = json.decodeFromJsonElement(s, e)
  private fun <T> encode(s: kotlinx.serialization.KSerializer<T>, v: T) = json.encodeToJsonElement(s, v)

  @Test
  fun everyCaseMatchesTheWebEngine() {
    val cases = root.getValue("cases").jsonArray
    assertTrue("expected hundreds of cases", cases.size > 300)
    val failures = mutableListOf<String>()
    var checks = 0
    for (c in cases) {
      val o = c.jsonObject
      val name = o.getValue("name").jsonPrimitive.content
      val d = decode(Diagram.serializer(), o.getValue("diagram"))
      fun check(what: String, expected: JsonElement, actual: JsonElement) {
        checks++
        if (expected != actual) failures += "$name · $what\n   expected $expected\n   actual   $actual"
      }
      for (v in o.getValue("validations").jsonArray) {
        val vo = v.jsonObject
        val opts = decode(ValidationOptions.serializer(), vo.getValue("options"))
        val r = validate(d, opts)
        val tag = "validate(${vo.getValue("options").toString().take(60)})"
        check("$tag.ok", vo.getValue("ok"), JsonPrimitive(r.ok))
        check("$tag.issues", vo.getValue("issues"), encode(ListSerializer(Issue.serializer()), r.issues))
        check("$tag.texts", vo.getValue("texts"), encode(ListSerializer(IssueText.serializer()), r.issues.map(::issueText)))
      }
      check("topology", o.getValue("topology"), JsonPrimitive(topologySignature(d)))
      check("channel", o.getValue("channel"), channelOf(d)?.let { JsonPrimitive(it.id) } ?: JsonNull)
      check("loops", o.getValue("loops"), JsonPrimitive(loopCount(d)))
      check("loopEdges", o.getValue("loopEdges"), JsonArray(loopEdges(d).map(::JsonPrimitive)))
      check("fermionLoops", o.getValue("fermionLoops"), JsonArray(fermionLoops(d).map { l -> JsonArray(l.sorted().map(::JsonPrimitive)) }))
      check("order", o.getValue("order"), JsonPrimitive(d.couplingOrder()))
      check("labels", o.getValue("labels"), JsonObject(d.edges.associate { it.id to JsonPrimitive(d.edgeLabel(it)) }))

      val tl = timeline(d)
      val t = o.getValue("timeline").jsonObject
      check("rank", t.getValue("rank"), JsonObject(tl.rank.mapValues { JsonPrimitive(it.value) }))
      val events = JsonArray(tl.events.map { ev ->
        fun tr(xs: List<dev.mmartos.feynmanquest.core.engine.Traversal>) = JsonArray(xs.map { x ->
          buildJsonObject {
            put("edge", x.edge.id); put("start", x.start); put("end", x.end); put("species", x.species.id); put("virtual", x.virtual)
          }
        })
        buildJsonObject { put("vertex", ev.vertex); put("ins", tr(ev.ins)); put("outs", tr(ev.outs)) }
      })
      check("events", t.getValue("events"), events)
      val narration = t.getValue("narration")
      if (narration !is JsonNull) {
        val captions = (0 until tl.events.size + 2).map { narrate(tl, it) }
        check("narration", narration, encode(ListSerializer(Caption.serializer()), captions))
      }
    }
    assertTrue("${failures.size} of $checks checks differ:\n" + failures.take(15).joinToString("\n"), failures.isEmpty())
  }

  @Test
  fun treeEnumerationMatches() {
    for (e in root.getValue("enumerations").jsonArray) {
      val o = e.jsonObject
      val ext = decode(ListSerializer(ExternalSpec.serializer()), o.getValue("externals"))
      val expected = o.getValue("signatures").jsonArray.map { it.jsonPrimitive.content }
      assertEquals(o.getValue("process").jsonPrimitive.content, expected, enumerateTrees(ext).map(::topologySignature).sorted())
    }
  }

  @Test
  fun contentLoads() {
    val content = Content.parse(File(shared, "content/es.json").readText())
    assertEquals(34, content.levels.size)
    assertEquals(7, content.chapters.size)
    assertEquals(34, content.concepts.size)
    assertEquals(listOf(5, 5, 6, 4, 4, 4, 6), content.chapters.map { ch -> content.levelsOf(ch.id).size })
    assertEquals(0, content.scoring.ranks.first().minXp)
    assertTrue(content.levels.all { l -> l.concepts.all { it in content.conceptById } })
    // Sanity: an int field parsed from the content survives.
    assertEquals(1, root.getValue("cases").jsonArray.first().jsonObject.getValue("order").jsonPrimitive.int.coerceAtMost(1))
  }
}
