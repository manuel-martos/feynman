package dev.mmartos.feynmanquest.core.game

import dev.mmartos.feynmanquest.core.content.Content
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/* Persistent player state and its pure reducers. Port of src/game/store.ts. */

@Serializable
enum class Layer {
  @SerialName("intuitive") Intuitive,
  @SerialName("scientific") Scientific,
  @SerialName("math") Math,
}

@Serializable
data class LevelProgress(val stars: Int, val completions: Int)

/** Local playtest metrics. Never leave the device unless exported. */
@Serializable
data class LevelMetrics(
  val starts: Int = 0,
  val completions: Int = 0,
  val mistakes: Int = 0,
  val hints: Int = 0,
  val totalMs: Long = 0,
  val firstNoHelp: Boolean? = null,
  val continuedToNext: Int = 0,
  val layers: Map<Layer, Int> = mapOf(Layer.Intuitive to 0, Layer.Scientific to 0, Layer.Math to 0),
  val firstCompletedAt: String? = null,
)

@Serializable
data class Settings(val sound: Boolean = true, val haptics: Boolean = true, val reducedMotion: Boolean = false)

@Serializable
data class Mastery(val sessions: Int = 0, val correct: Int = 0, val total: Int = 0)

@Serializable
data class GameState(
  val onboarded: Boolean = false,
  val xp: Int = 0,
  val progress: Map<Int, LevelProgress> = emptyMap(),
  val concepts: List<String> = emptyList(),
  val seenConcepts: List<String> = emptyList(),
  val settings: Settings = Settings(),
  val metrics: Map<Int, LevelMetrics> = emptyMap(),
  val mastery: Mastery = Mastery(),
) {
  fun isUnlocked(levelId: Int) = levelId == 1 || progress.containsKey(levelId - 1)
  val totalStars: Int get() = progress.values.sumOf { it.stars }
  /** The mathematical explanation layer and the Dominio mode open after chapter 1. */
  val mathUnlocked: Boolean get() = progress.containsKey(5)
  val levelsDone: Int get() = progress.size
  fun nextLevel(content: Content) = content.levels.firstOrNull { !progress.containsKey(it.id) && isUnlocked(it.id) }
  val unseenConcepts: Int get() = concepts.count { it !in seenConcepts }
}

data class LevelResult(
  val stars: Int,
  val xp: Int,
  val newConcepts: List<String>,
  val firstTime: Boolean,
  val previousStars: Int,
)

fun GameState.startLevel(id: Int, fromPrevious: Boolean): GameState {
  val m = metrics.toMutableMap()
  m[id] = (m[id] ?: LevelMetrics()).let { it.copy(starts = it.starts + 1) }
  if (fromPrevious) m[id - 1]?.let { m[id - 1] = it.copy(continuedToNext = it.continuedToNext + 1) }
  return copy(metrics = m)
}

fun GameState.completeLevel(
  scoring: dev.mmartos.feynmanquest.core.content.Scoring,
  id: Int,
  mistakes: Int,
  hints: Int,
  ms: Long,
  unlocks: List<String>,
  now: String,
): Pair<GameState, LevelResult> {
  val prev = progress[id]
  val stars = starsFor(mistakes, hints)
  val previousStars = prev?.stars ?: 0
  val gained = scoring.xpGain(previousStars, stars)
  val newConcepts = unlocks.filter { it !in concepts }
  var m = metrics[id] ?: LevelMetrics()
  if (m.completions == 0) m = m.copy(firstNoHelp = hints == 0, firstCompletedAt = now)
  m = m.copy(completions = m.completions + 1, mistakes = m.mistakes + mistakes, hints = m.hints + hints, totalMs = m.totalMs + ms)
  val next = copy(
    xp = xp + gained,
    progress = progress + (id to LevelProgress(maxOf(previousStars, stars), (prev?.completions ?: 0) + 1)),
    concepts = concepts + newConcepts,
    metrics = metrics + (id to m),
  )
  return next to LevelResult(stars, gained, newConcepts, prev == null, previousStars)
}

fun GameState.recordLayer(id: Int, layer: Layer): GameState {
  val m = metrics[id] ?: LevelMetrics()
  return copy(metrics = metrics + (id to m.copy(layers = m.layers + (layer to (m.layers[layer] ?: 0) + 1))))
}

fun GameState.recordMastery(correct: Int, total: Int) =
  copy(mastery = Mastery(mastery.sessions + 1, mastery.correct + correct, mastery.total + total))

fun GameState.reset() = GameState(onboarded = true, settings = settings)
