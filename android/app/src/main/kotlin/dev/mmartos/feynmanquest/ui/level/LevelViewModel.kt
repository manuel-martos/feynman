package dev.mmartos.feynmanquest.ui.level

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.assisted.Assisted
import dagger.assisted.AssistedFactory
import dagger.assisted.AssistedInject
import dagger.hilt.android.lifecycle.HiltViewModel
import dev.mmartos.feynmanquest.core.content.Chapter
import dev.mmartos.feynmanquest.core.content.Level
import dev.mmartos.feynmanquest.core.engine.Diagram
import dev.mmartos.feynmanquest.core.game.LevelResult
import dev.mmartos.feynmanquest.data.ContentRepository
import dev.mmartos.feynmanquest.data.GameRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class Phase { Intro, Play, Done }

data class LevelUiState(
  val level: Level,
  val chapter: Chapter,
  val nextLevel: Level?,
  val phase: Phase = Phase.Intro,
  val stepIdx: Int = 0,
  val solved: Boolean = false,
  val mistakes: Int = 0,
  val hintsUsed: Int = 0,
  /** Hints revealed for the current step (0–2). */
  val hintTier: Int = 0,
  val showHint: Boolean = false,
  val built: Diagram? = null,
  val result: LevelResult? = null,
) {
  val step get() = level.steps[stepIdx]
  val isLast get() = stepIdx == level.steps.lastIndex
}

/** One run of a level: intro → steps (with hints and mistakes) → result. */
@HiltViewModel(assistedFactory = LevelViewModel.Factory::class)
class LevelViewModel @AssistedInject constructor(
  @Assisted levelId: Int,
  contentRepository: ContentRepository,
  private val game: GameRepository,
) : ViewModel() {
  @AssistedFactory interface Factory { fun create(levelId: Int): LevelViewModel }

  val content = contentRepository.content
  private val level = content.level(levelId)
  private var startedAt = 0L

  private val _state = MutableStateFlow(
    level?.let { LevelUiState(it, content.chapter(it.chapter)!!, content.level(it.id + 1)) },
  )
  /** Null when the level does not exist. */
  val state: StateFlow<LevelUiState?> = _state.asStateFlow()

  private fun set(f: LevelUiState.() -> LevelUiState) = _state.update { it?.f() }

  fun begin() {
    val l = level ?: return
    viewModelScope.launch { game.startLevel(l.id, fromPrevious = game.lastCompleted == l.id - 1) }
    startedAt = System.currentTimeMillis()
    set { copy(phase = Phase.Play) }
  }

  fun mistake() = set { copy(mistakes = mistakes + 1) }

  fun solved(diagram: Diagram?) = set { copy(solved = true, showHint = false, built = diagram ?: built) }

  fun revealHint() = set {
    if (hintTier < 2) copy(hintTier = hintTier + 1, hintsUsed = hintsUsed + 1, showHint = true) else copy(showHint = true)
  }

  fun closeHint() = set { copy(showHint = false) }

  /** Next step, or finish the level and record the result. */
  fun next() {
    val s = _state.value ?: return
    if (!s.isLast) {
      set { copy(stepIdx = stepIdx + 1, solved = false, hintTier = 0, showHint = false) }
      return
    }
    viewModelScope.launch {
      val r = game.completeLevel(s.level.id, s.mistakes, s.hintsUsed, System.currentTimeMillis() - startedAt)
      set { copy(phase = Phase.Done, result = r) }
    }
  }
}
