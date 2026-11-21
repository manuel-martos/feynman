package dev.mmartos.feynmanquest.ui.practice

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import dev.mmartos.feynmanquest.core.content.Step
import dev.mmartos.feynmanquest.core.game.PracticeGenerator
import dev.mmartos.feynmanquest.data.GameRepository
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PracticeUiState(
  val steps: List<Step>,
  val idx: Int = 0,
  val solved: Boolean = false,
  val missed: Boolean = false,
  val firstTry: Int = 0,
  val finished: Boolean = false,
) {
  val step get() = steps[idx]
  val percent get() = firstTry * 100 / steps.size
}

/** "Dominio" sessions: six generated questions, scored on first-try answers. */
@HiltViewModel
class PracticeViewModel @Inject constructor(private val game: GameRepository) : ViewModel() {
  private val generator = PracticeGenerator()
  private fun levelsDone() = game.state.value?.levelsDone ?: 0

  private val _state = MutableStateFlow(PracticeUiState(generator.session(levelsDone())))
  val state: StateFlow<PracticeUiState> = _state.asStateFlow()

  fun mistake() = _state.update { it.copy(missed = true) }
  fun solved() = _state.update { it.copy(solved = true) }

  fun next() {
    val s = _state.value
    val ok = s.firstTry + if (s.missed) 0 else 1
    if (s.idx == s.steps.lastIndex) {
      _state.value = s.copy(firstTry = ok, finished = true)
      viewModelScope.launch { game.recordMastery(ok, s.steps.size) }
    } else {
      _state.value = s.copy(firstTry = ok, idx = s.idx + 1, solved = false, missed = false)
    }
  }

  fun again() { _state.value = PracticeUiState(generator.session(levelsDone())) }
}
