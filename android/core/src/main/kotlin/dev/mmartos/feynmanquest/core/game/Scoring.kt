package dev.mmartos.feynmanquest.core.game

import dev.mmartos.feynmanquest.core.content.Rank
import dev.mmartos.feynmanquest.core.content.Scoring

/** Stars reward understanding: errors and hints reduce them, time never does. */
fun starsFor(mistakes: Int, hints: Int): Int = when {
  mistakes == 0 && hints == 0 -> 3
  mistakes <= 2 && hints <= 1 -> 2
  else -> 1
}

/** XP gained when finishing a level, only counting improvements. */
fun Scoring.xpGain(previousStars: Int, newStars: Int): Int =
  (if (previousStars == 0) xpBase else 0) + maxOf(0, newStars - previousStars) * xpPerStar

data class RankProgress(val rank: Rank, val next: Rank?, val progress: Float)

fun Scoring.rankFor(xp: Int): RankProgress {
  var i = 0
  while (i + 1 < ranks.size && xp >= ranks[i + 1].minXp) i++
  val rank = ranks[i]
  val next = ranks.getOrNull(i + 1)
  val progress = if (next != null) (xp - rank.minXp).toFloat() / (next.minXp - rank.minXp) else 1f
  return RankProgress(rank, next, progress)
}
