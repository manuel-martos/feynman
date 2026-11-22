package dev.mmartos.feynmanquest.ui.level

import androidx.annotation.StringRes
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.mmartos.feynmanquest.R
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.content.firstDiagram
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.core.game.Layer
import dev.mmartos.feynmanquest.ui.LocalLanguage
import dev.mmartos.feynmanquest.ui.Navigator
import dev.mmartos.feynmanquest.ui.components.AppButton
import dev.mmartos.feynmanquest.ui.components.ButtonStyle
import dev.mmartos.feynmanquest.ui.components.Eyebrow
import dev.mmartos.feynmanquest.ui.components.ExplanationTabs
import dev.mmartos.feynmanquest.ui.components.GlassCard
import dev.mmartos.feynmanquest.ui.components.IconSquare
import dev.mmartos.feynmanquest.ui.components.Icons24
import dev.mmartos.feynmanquest.ui.components.LineIcon
import dev.mmartos.feynmanquest.ui.components.MechanicBadge
import dev.mmartos.feynmanquest.ui.components.Stars
import dev.mmartos.feynmanquest.ui.diagram.DiagramCanvas
import dev.mmartos.feynmanquest.ui.diagram.DiagramPlayback
import dev.mmartos.feynmanquest.ui.feedback.Haptic
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.LocalReducedMotion
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk
import kotlin.math.cos
import kotlin.math.sin
import kotlinx.coroutines.delay

@Composable
fun LevelScreen(id: Int, game: GameState, nav: Navigator, onLayer: (Int, Layer) -> Unit) {
  val language = LocalLanguage.current
  // Keyed by language too, so a language change never keeps showing a level in the old one.
  val vm = hiltViewModel<LevelViewModel, LevelViewModel.Factory>(key = "level-$id-${language.id}", creationCallback = { it.create(id, language) })
  val ui by vm.state.collectAsStateWithLifecycle()
  val s = ui
  when {
    s == null -> Centered(stringResource(R.string.level_not_found), stringResource(R.string.level_campaign)) { nav.map() }
    !game.isUnlocked(id) && s.phase == Phase.Intro -> Centered(stringResource(R.string.level_locked), stringResource(R.string.level_back_to_campaign)) { nav.map() }
    else -> AnimatedContent(s.phase, transitionSpec = { fadeIn(tween(300)) togetherWith fadeOut(tween(150)) }, label = "phase") { phase ->
      when (phase) {
        Phase.Intro -> LevelIntro(s, game, onBack = { nav.map(s.level.chapter) }, onBegin = vm::begin)
        Phase.Play -> LevelPlay(s, vm, onExit = { nav.map(s.level.chapter) })
        Phase.Done -> LevelDone(s, vm.content, game, nav, onLayer = { onLayer(id, it) })
      }
    }
  }
}

@Composable
private fun Centered(text: String, action: String, onClick: () -> Unit) {
  Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically), horizontalAlignment = Alignment.CenterHorizontally) {
    Text(text, color = Cosmic.Text, style = MaterialTheme.typography.bodyLarge)
    AppButton(action, onClick, style = ButtonStyle.Primary)
  }
}

/** Common frame: centred column with safe areas, scroll and an optional bottom action. */
@Composable
private fun LevelFrame(
  top: @Composable () -> Unit,
  bottom: (@Composable () -> Unit)? = null,
  scrollKey: Any? = null,
  content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
  Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
    Column(Modifier.widthIn(max = 560.dp).fillMaxSize().statusBarsPadding()) {
      Box(Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) { top() }
      key(scrollKey) {
        Column(
          Modifier.weight(1f).fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp).padding(bottom = 24.dp),
          verticalArrangement = Arrangement.spacedBy(16.dp),
          content = content,
        )
      }
      if (bottom != null) Box(Modifier.navigationBarsPadding().padding(16.dp)) { bottom() }
      else Spacer(Modifier.navigationBarsPadding())
    }
  }
}

@Composable
private fun LevelIntro(s: LevelUiState, game: GameState, onBack: () -> Unit, onBegin: () -> Unit) {
  val chColor = Cosmic.chapter(s.chapter.color)
  val preview = remember(s.level) { s.level.firstDiagram() }
  val prevBest = game.progress[s.level.id]?.stars ?: 0
  LevelFrame(
    top = {
      Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        IconSquare(onBack, stringResource(R.string.level_back)) { LineIcon(Icons24.Back) }
        Text(stringResource(R.string.level_where, s.chapter.id, s.level.id), Modifier.weight(1f), color = Cosmic.Text2, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.size(44.dp))
      }
    },
    bottom = { AppButton(stringResource(if (prevBest > 0) R.string.level_play_again else R.string.level_start), onBegin, Modifier.fillMaxWidth(), ButtonStyle.Primary, large = true) },
  ) {
    preview?.let {
      val shape = RoundedCornerShape(32.dp)
      Box(
        Modifier.fillMaxWidth().clip(shape)
          .background(Brush.verticalGradient(listOf(Color(0x66111840), Color(0x8805071A))))
          .drawBehind { drawRect(Brush.radialGradient(listOf(chColor.copy(alpha = 0.22f), Color.Transparent), Offset(size.width / 2, 0f), size.width * 0.8f)) }
          .border(1.dp, chColor.copy(alpha = 0.35f), shape).padding(16.dp),
      ) { DiagramCanvas(it, Modifier.fillMaxWidth(), showLabels = false) }
    }
    MechanicBadge(s.level.mechanic, long = true)
    Text(s.level.title, style = MaterialTheme.typography.displaySmall, color = Cosmic.Text, modifier = Modifier.semantics { heading() })
    Text(s.level.intro, style = MaterialTheme.typography.bodyLarge.copy(fontSize = 18.sp, lineHeight = 27.sp), color = Cosmic.Text2)
    if (prevBest > 0) Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
      Text(stringResource(R.string.level_best), color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium)
      Stars(prevBest)
    }
  }
}

@Composable
private fun LevelPlay(s: LevelUiState, vm: LevelViewModel, onExit: () -> Unit) {
  val fb = LocalFeedback.current
  val step = s.step
  Box(Modifier.fillMaxSize()) {
    LevelFrame(
      scrollKey = step.id,
      top = {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
          IconSquare(onExit, stringResource(R.string.level_exit)) { LineIcon(Icons24.Close) }
          StepProgress(s.level.steps.size, s.stepIdx, s.solved, Modifier.weight(1f))
          Box {
            IconSquare({ vm.revealHint() }, stringResource(R.string.level_hint), enabled = !s.solved, tint = Cosmic.Photon) { LineIcon(Icons24.Bulb) }
            if (s.hintTier > 0) Text(
              "${s.hintTier}", Modifier.align(Alignment.TopEnd).padding(top = 0.dp).size(18.dp).clip(CircleShape).background(Cosmic.Photon),
              color = Cosmic.Bg0, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center,
            )
          }
        }
      },
    ) {
      MechanicBadge(s.level.mechanic)
      AnimatedContent(step.prompt, transitionSpec = { (slideInHorizontally { it / 8 } + fadeIn()) togetherWith fadeOut() }, label = "prompt") {
        Text(it, style = MaterialTheme.typography.headlineSmall.copy(fontSize = 23.sp, lineHeight = 29.sp), color = Cosmic.Text, modifier = Modifier.semantics { heading() })
      }
      AnimatedVisibility(s.showHint && s.hintTier > 0 && !s.solved, enter = fadeIn() + expandVertically(), exit = fadeOut() + shrinkVertically()) {
        HintCard(s, onMore = vm::revealHint, onClose = vm::closeHint)
      }
      key(step.id) {
        StepPlayer(
          step, s.solved, onMistake = vm::mistake,
          onSolved = { d -> vm.solved(d); fb.sfx(Sfx.Success); fb.haptic(Haptic.Confirm) },
        )
      }
      // Room so the solved sheet never covers the content.
      if (s.solved) Spacer(Modifier.height(170.dp))
    }
    AnimatedVisibility(
      s.solved, Modifier.align(Alignment.BottomCenter),
      enter = slideInVertically(tween(380)) { it } + fadeIn(), exit = slideOutVertically { it } + fadeOut(),
    ) {
      SolvedSheet(
        title = stringResource(if (s.isLast) R.string.level_passed else R.string.level_correct),
        text = step.solved,
        action = stringResource(if (s.isLast) R.string.level_see_result else R.string.level_next),
        onNext = vm::next,
      )
    }
  }
}

@Composable
fun StepProgress(count: Int, idx: Int, solved: Boolean, modifier: Modifier = Modifier) {
  Row(
    modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo((idx + if (solved) 1 else 0).toFloat(), 0f..count.toFloat(), count) },
    horizontalArrangement = Arrangement.spacedBy(6.dp),
  ) {
    repeat(count) { i ->
      val done = i < idx || (i == idx && solved)
      val c by animateColorAsState(if (done) Cosmic.Success else if (i == idx) Cosmic.Accent2 else Cosmic.Surface2, label = "seg")
      Box(Modifier.weight(1f).height(8.dp).clip(CircleShape).background(c))
    }
  }
}

@Composable
private fun HintCard(s: LevelUiState, onMore: () -> Unit, onClose: () -> Unit) {
  val fb = LocalFeedback.current
  Row(
    Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(Cosmic.Photon.copy(alpha = 0.10f))
      .border(1.dp, Cosmic.Photon.copy(alpha = 0.4f), RoundedCornerShape(18.dp)).padding(14.dp)
      .semantics { liveRegion = LiveRegionMode.Polite },
    horizontalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    Text("💡", fontSize = 20.sp)
    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
      Text(stringResource(if (s.hintTier == 1) R.string.level_hint else R.string.level_rule), color = Cosmic.Photon, style = MaterialTheme.typography.titleSmall)
      Text(s.step.hints.getOrElse(s.hintTier - 1) { "" }, color = Cosmic.Text, style = MaterialTheme.typography.bodyMedium)
      if (s.hintTier == 1) Text(
        stringResource(R.string.level_more_help), color = Cosmic.Accent2, style = MaterialTheme.typography.labelLarge,
        modifier = Modifier.clip(RoundedCornerShape(6.dp)).clickable { fb.sfx(Sfx.Tap); onMore() }.padding(vertical = 4.dp),
      )
    }
    IconSquare(onClose, stringResource(R.string.level_close_hint), size = 32.dp) { LineIcon(Icons24.Close, Modifier.size(14.dp)) }
  }
}

@Composable
fun SolvedSheet(title: String, text: String?, action: String, onNext: () -> Unit) {
  val shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
  Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
    Column(
      Modifier.widthIn(max = 560.dp).fillMaxWidth().clip(shape)
        .background(Brush.verticalGradient(listOf(Color(0xFF0F2A2A), Color(0xFF0A1A24))))
        .border(1.dp, Cosmic.Success.copy(alpha = 0.45f), shape)
        .navigationBarsPadding().padding(18.dp)
        .semantics { liveRegion = LiveRegionMode.Polite },
      verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
      Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
        Box(Modifier.size(36.dp).clip(CircleShape).background(Cosmic.Success), contentAlignment = Alignment.Center) {
          Text("✓", color = Cosmic.Bg0, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
        }
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
          Text(title, style = MaterialTheme.typography.titleLarge, color = Cosmic.Success)
          text?.let { Text(it, color = Cosmic.Text, style = MaterialTheme.typography.bodyMedium) }
        }
      }
      AppButton(action, onNext, Modifier.fillMaxWidth(), ButtonStyle.Success, large = true)
    }
  }
}

@StringRes private fun starsTitle(s: Int) = when (s) { 3 -> R.string.done_perfect; 2 -> R.string.done_great; else -> R.string.done_passed }

@Composable
private fun LevelDone(s: LevelUiState, content: Content, game: GameState, nav: Navigator, onLayer: (Layer) -> Unit) {
  val r = s.result ?: return
  val fb = LocalFeedback.current
  val next = s.nextLevel
  val chapterDone = next == null || next.chapter != s.level.chapter
  val nextChapter = if (next != null && chapterDone) next.chapter else null
  val hero = remember(s.level, s.built) { s.built ?: s.level.firstDiagram() }

  LaunchedEffect(Unit) {
    onLayer(Layer.Intuitive)
    delay(200); fb.sfx(Sfx.Unlock); fb.haptic(Haptic.Confirm)
    repeat(r.stars) { i -> delay(if (i == 0) 250 else 260); fb.sfx(Sfx.Star) }
  }

  LevelFrame(
    top = {},
    bottom = {
      Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        // The secondary button takes the width its label needs (it varies by language); the primary one fills the rest.
        AppButton(stringResource(R.string.done_campaign), { nav.map(s.level.chapter) }, style = ButtonStyle.Ghost, large = true)
        if (next != null) AppButton(stringResource(R.string.done_next_level), { nav.replaceLevel(next.id) }, Modifier.weight(1f), ButtonStyle.Primary, large = true)
        else AppButton(stringResource(R.string.done_mastery), { nav.home(); nav.practice() }, Modifier.weight(1f), ButtonStyle.Primary, large = true)
      }
    },
  ) {
    Box(Modifier.fillMaxWidth().padding(top = 8.dp), contentAlignment = Alignment.Center) {
      Confetti(Modifier.fillMaxWidth().height(150.dp))
      Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Stars(r.stars, size = 48.dp, animate = true)
        Text(stringResource(if (next == null) R.string.done_campaign_done else starsTitle(r.stars)), style = MaterialTheme.typography.displaySmall, color = Cosmic.Text, modifier = Modifier.semantics { heading() })
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
          Text(
            (if (s.mistakes == 0) stringResource(R.string.done_no_mistakes) else pluralStringResource(R.plurals.done_mistakes, s.mistakes, s.mistakes)) + " · " +
              (if (s.hintsUsed == 0) stringResource(R.string.done_no_hints) else pluralStringResource(R.plurals.done_hints, s.hintsUsed, s.hintsUsed)),
            color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium,
          )
          if (r.xp > 0) Text(
            "+${r.xp} XP", Modifier.clip(CircleShape).background(Cosmic.Photon.copy(alpha = 0.16f)).border(1.dp, Cosmic.Photon.copy(alpha = 0.5f), CircleShape).padding(horizontal = 10.dp, vertical = 2.dp),
            color = Cosmic.Photon, style = MaterialTheme.typography.labelMedium,
          )
        }
      }
    }

    GlassCard(Modifier.fillMaxWidth(), border = Cosmic.Success.copy(alpha = 0.35f)) {
      hero?.let { DiagramPlayback(it, autoPlay = true) }
      Text(s.level.success, color = Cosmic.Text, style = MaterialTheme.typography.bodyLarge)
    }

    GlassCard(Modifier.fillMaxWidth()) {
      Eyebrow(stringResource(R.string.done_understand))
      ExplanationTabs(s.level.explanation, game.mathUnlocked, onView = onLayer)
    }

    if (r.newConcepts.isNotEmpty()) {
      GlassCard(Modifier.fillMaxWidth(), border = Cosmic.Positron.copy(alpha = 0.35f)) {
        Eyebrow(stringResource(R.string.done_new_in_collection))
        r.newConcepts.forEach { id ->
          Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(content.conceptById[id]?.symbol ?: "✦", color = Cosmic.Positron, fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(content.conceptById[id]?.title ?: id, color = Cosmic.Text, style = MaterialTheme.typography.titleSmall)
          }
        }
      }
    }
    if (nextChapter != null) {
      val ch = content.chapter(nextChapter)
      if (ch != null) {
        val c = Cosmic.chapter(ch.color)
        GlassCard(Modifier.fillMaxWidth(), background = Brush.verticalGradient(listOf(c.copy(alpha = 0.16f), c.copy(alpha = 0.04f))), border = c.copy(alpha = 0.5f)) {
          Eyebrow(stringResource(R.string.done_chapter_unlocked), color = c)
          Text("${ch.id}. ${ch.title}", style = MaterialTheme.typography.titleLarge, color = Cosmic.Text)
          Text(ch.goals, color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium)
        }
      }
    }
    if (s.level.id == 5) Text(stringResource(R.string.done_math_unlocked), color = Cosmic.Photon, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
  }
}

/** A short burst of confetti behind the stars. */
@Composable
private fun Confetti(modifier: Modifier) {
  if (LocalReducedMotion.current) return
  val t = remember { Animatable(0f) }
  LaunchedEffect(Unit) { t.animateTo(1f, tween(1600, easing = LinearEasing)) }
  val colors = listOf(Cosmic.Electron, Cosmic.Positron, Cosmic.Photon, Cosmic.Accent, Cosmic.Success)
  Canvas(modifier.graphicsLayer { alpha = (1.2f - t.value).coerceIn(0f, 1f) }) {
    val c = Offset(size.width / 2, size.height * 0.45f)
    repeat(18) { k ->
      val ang = (k / 18f) * 2 * Math.PI.toFloat() + k * 0.37f
      val dist = (60f + (k % 5) * 18f) * density * t.value
      val p = c + Offset(cos(ang) * dist, sin(ang) * dist * 0.7f + 80f * density * t.value * t.value)
      drawRect(colors[k % colors.size], topLeft = p, size = androidx.compose.ui.geometry.Size(6f * density, 10f * density))
    }
  }
}
