package dev.mmartos.feynmanquest.data

import android.content.Context
import androidx.datastore.core.CorruptionException
import androidx.datastore.core.DataStore
import androidx.datastore.core.DataStoreFactory
import androidx.datastore.core.Serializer
import androidx.datastore.dataStoreFile
import dagger.hilt.android.qualifiers.ApplicationContext
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.core.game.Layer
import dev.mmartos.feynmanquest.core.game.LevelResult
import dev.mmartos.feynmanquest.core.game.Settings
import dev.mmartos.feynmanquest.core.game.completeLevel
import dev.mmartos.feynmanquest.core.game.recordLayer
import dev.mmartos.feynmanquest.core.game.recordMastery
import dev.mmartos.feynmanquest.core.game.reset
import dev.mmartos.feynmanquest.core.game.startLevel
import java.io.InputStream
import java.io.OutputStream
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json

object GameStateSerializer : Serializer<GameState> {
  private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
  override val defaultValue = GameState()
  override suspend fun readFrom(input: InputStream): GameState = try {
    json.decodeFromString(GameState.serializer(), input.readBytes().decodeToString())
  } catch (e: SerializationException) {
    throw CorruptionException("Unreadable game state", e)
  }
  override suspend fun writeTo(t: GameState, output: OutputStream) =
    output.write(json.encodeToString(GameState.serializer(), t).encodeToByteArray())
  fun export(t: GameState): String = Json { prettyPrint = true; encodeDefaults = true }.encodeToString(GameState.serializer(), t)
}

/** Single source of truth for the player's progress, persisted with DataStore. */
@Singleton
class GameRepository internal constructor(
  private val store: DataStore<GameState>,
  private val content: Content,
  scope: CoroutineScope,
) {
  @Inject constructor(@ApplicationContext context: Context, contentRepository: ContentRepository) : this(
    DataStoreFactory.create(GameStateSerializer, produceFile = { context.dataStoreFile("game.json") }),
    contentRepository.content,
    CoroutineScope(SupervisorJob() + Dispatchers.IO),
  )

  /** Null until the first read finishes, so the UI can avoid flashing onboarding. */
  val state: StateFlow<GameState?> = store.data.stateIn(scope, SharingStarted.Eagerly, null)

  private suspend fun update(f: (GameState) -> GameState) { store.updateData(f) }

  /** Last level completed in this session, to measure voluntary continuation. */
  @Volatile var lastCompleted: Int? = null

  suspend fun finishOnboarding() = update { it.copy(onboarded = true) }
  suspend fun startLevel(id: Int, fromPrevious: Boolean) = update { it.startLevel(id, fromPrevious) }
  suspend fun recordLayer(id: Int, layer: Layer) = update { it.recordLayer(id, layer) }
  suspend fun markConceptsSeen() = update { it.copy(seenConcepts = it.concepts) }
  suspend fun recordMastery(correct: Int, total: Int) = update { it.recordMastery(correct, total) }
  suspend fun setSettings(f: (Settings) -> Settings) = update { it.copy(settings = f(it.settings)) }
  suspend fun reset() = update { it.reset() }

  suspend fun completeLevel(id: Int, mistakes: Int, hints: Int, ms: Long): LevelResult {
    lateinit var result: LevelResult
    val unlocks = content.level(id)?.concepts.orEmpty()
    update { s ->
      val (next, r) = s.completeLevel(content.scoring, id, mistakes, hints, ms, unlocks, Instant.now().toString())
      result = r
      next
    }
    lastCompleted = id
    return result
  }
}
