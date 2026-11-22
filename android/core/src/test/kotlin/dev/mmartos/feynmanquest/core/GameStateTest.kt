package dev.mmartos.feynmanquest.core

import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.content.Language
import dev.mmartos.feynmanquest.core.content.Rank
import dev.mmartos.feynmanquest.core.content.Scoring
import dev.mmartos.feynmanquest.core.content.issueText
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.core.game.PracticeGenerator
import dev.mmartos.feynmanquest.core.game.completeLevel
import dev.mmartos.feynmanquest.core.game.rankFor
import dev.mmartos.feynmanquest.core.game.starsFor
import java.io.File
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GameStateTest {
  private val scoring = Scoring(50, 25, listOf(Rank("curious", "Curioso", 0), Rank("apprentice", "Aprendiz cuántico", 300)))

  @Test fun stars() {
    assertEquals(3, starsFor(0, 0))
    assertEquals(2, starsFor(2, 1))
    assertEquals(1, starsFor(3, 0))
    assertEquals(1, starsFor(0, 2))
  }

  @Test fun xpOnlyCountsImprovements() {
    val (s1, r1) = GameState().completeLevel(scoring, 1, 1, 0, 1000, listOf("electron"), "t")
    assertEquals(2, r1.stars); assertEquals(100, r1.xp); assertTrue(r1.firstTime)
    val (s2, r2) = s1.completeLevel(scoring, 1, 0, 0, 1000, listOf("electron"), "t")
    assertEquals(25, r2.xp); assertEquals(emptyList<String>(), r2.newConcepts)
    val (s3, r3) = s2.completeLevel(scoring, 1, 5, 5, 1000, emptyList(), "t")
    assertEquals(0, r3.xp); assertEquals(3, s3.progress.getValue(1).stars)
    assertEquals(3, s3.metrics.getValue(1).completions)
    assertTrue(s3.isUnlocked(2)); assertFalse(s3.isUnlocked(3))
  }

  @Test fun ranks() {
    assertEquals("Curioso", scoring.rankFor(299).rank.title)
    assertEquals("Aprendiz cuántico", scoring.rankFor(300).rank.title)
    assertEquals(1f, scoring.rankFor(5000).progress)
  }

  @Test fun practiceSessionsAreWellFormed() = Language.entries.forEach { lang ->
    val shared = File(System.getProperty("shared.dir") ?: "../../shared")
    val text = Content.parse(File(shared, "content/${lang.id}.json").readText()).practice
    val gen = PracticeGenerator(text, { issueText(it, lang).body }, Random(7))
    repeat(50) { i ->
      val steps = gen.session(i)
      assertEquals(6, steps.size)
      steps.filterIsInstance<dev.mmartos.feynmanquest.core.content.ChoiceStep>().forEach { s -> assertEquals(1, s.options.count { it.correct }) }
      steps.filterIsInstance<dev.mmartos.feynmanquest.core.content.TapStep>().forEach { s -> assertTrue(s.targets.all { t -> s.diagram.edges.any { it.id == t } }) }
      assertTrue(steps.all { it.prompt.isNotBlank() && it.hints.size == 2 })
    }
  }
}
