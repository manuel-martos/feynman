package dev.mmartos.feynmanquest.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.content.Language
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.core.game.Layer
import dev.mmartos.feynmanquest.core.game.Settings
import dev.mmartos.feynmanquest.data.ContentRepository
import dev.mmartos.feynmanquest.data.GameRepository
import dev.mmartos.feynmanquest.data.GameStateSerializer
import javax.inject.Inject
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

/** App-wide state: content plus the persisted progress, and the actions on it. */
@HiltViewModel
class AppViewModel @Inject constructor(
  private val contentRepository: ContentRepository,
  private val game: GameRepository,
) : ViewModel() {
  fun content(language: Language): Content = contentRepository.content(language)
  val state: StateFlow<GameState?> = game.state

  fun finishOnboarding() = viewModelScope.launch { game.finishOnboarding() }
  fun markConceptsSeen() = viewModelScope.launch { game.markConceptsSeen() }
  fun updateSettings(f: (Settings) -> Settings) = viewModelScope.launch { game.setSettings(f) }
  fun reset() = viewModelScope.launch { game.reset() }
  fun recordLayer(level: Int, layer: Layer) = viewModelScope.launch { game.recordLayer(level, layer) }
  fun exportJson(): String = state.value?.let(GameStateSerializer::export) ?: "{}"
}
