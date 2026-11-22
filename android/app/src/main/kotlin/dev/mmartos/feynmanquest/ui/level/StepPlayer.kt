package dev.mmartos.feynmanquest.ui.level

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mmartos.feynmanquest.R
import dev.mmartos.feynmanquest.core.content.BuildStep
import dev.mmartos.feynmanquest.core.content.ChoiceStep
import dev.mmartos.feynmanquest.core.content.Step
import dev.mmartos.feynmanquest.core.content.TapMode
import dev.mmartos.feynmanquest.core.content.TapStep
import dev.mmartos.feynmanquest.core.content.Tappable
import dev.mmartos.feynmanquest.core.content.issueText
import dev.mmartos.feynmanquest.core.engine.Diagram
import dev.mmartos.feynmanquest.core.engine.validate
import dev.mmartos.feynmanquest.ui.LocalLanguage
import dev.mmartos.feynmanquest.ui.components.AppButton
import dev.mmartos.feynmanquest.ui.components.ButtonStyle
import dev.mmartos.feynmanquest.ui.components.FeedbackBanner
import dev.mmartos.feynmanquest.ui.diagram.DiagramCanvas
import dev.mmartos.feynmanquest.ui.diagram.DiagramEditor
import dev.mmartos.feynmanquest.ui.diagram.DiagramPlayback
import dev.mmartos.feynmanquest.ui.feedback.Haptic
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.LocalReducedMotion
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk

data class Notice(val title: String, val body: String, val error: Boolean)

/** Plays one step of a level: tap (decode), multiple choice, or build/debug. */
@Composable
fun StepPlayer(step: Step, solved: Boolean, onMistake: () -> Unit, onSolved: (Diagram?) -> Unit, modifier: Modifier = Modifier) {
  Column(modifier, verticalArrangement = Arrangement.spacedBy(14.dp)) {
    when (step) {
      is TapStep -> TapPlayer(step, solved, onMistake, onSolved)
      is ChoiceStep -> ChoicePlayer(step, solved, onMistake, onSolved)
      is BuildStep -> BuildPlayer(step, solved, onMistake, onSolved)
    }
  }
}

/** Card that frames a diagram (`.diagram-card`). */
@Composable
fun DiagramCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
  val shape = RoundedCornerShape(28.dp)
  Column(
    modifier
      .fillMaxWidth()
      .clip(shape)
      .background(Brush.verticalGradient(listOf(Color(0x66111840), Color(0x8805071A))))
      .border(1.dp, Cosmic.Border, shape)
      .padding(14.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
    content = content,
  )
}

@Composable
private fun NoticeSlot(n: Notice?) {
  Box(Modifier.fillMaxWidth().semantics { liveRegion = LiveRegionMode.Polite }) {
    AnimatedVisibility(n != null, enter = fadeIn() + expandVertically(), exit = fadeOut() + shrinkVertically()) {
      var last by remember { mutableStateOf(n) }
      if (n != null) last = n
      last?.let { FeedbackBanner(it.title, it.body, it.error) }
    }
  }
}

/* ---------------- Decode: tap elements ---------------- */

@Composable
private fun TapPlayer(step: TapStep, solved: Boolean, onMistake: () -> Unit, onSolved: (Diagram?) -> Unit) {
  val fb = LocalFeedback.current
  var selected by remember { mutableStateOf(emptySet<String>()) }
  var errors by remember { mutableStateOf(emptySet<String>()) }
  var notice by remember { mutableStateOf<Notice?>(null) }
  val targets = step.targets.toSet()
  val res = LocalResources.current

  fun wrong(ids: List<String>, msg: String) {
    errors = ids.toSet()
    notice = Notice(res.getString(R.string.step_wrong), msg, true)
    fb.sfx(Sfx.Error); fb.haptic(Haptic.Reject)
    onMistake()
  }

  fun onTap(id: String) {
    if (solved) return
    errors = emptySet()
    if (step.mode == TapMode.Any) {
      if (id in targets) { selected = setOf(id); notice = null; fb.sfx(Sfx.Select); onSolved(null) }
      else wrong(listOf(id), step.wrong?.get(id) ?: step.wrongDefault)
      return
    }
    selected = if (id in selected) selected - id else selected + id
    notice = null
    fb.sfx(Sfx.Select)
  }

  fun check() {
    val extra = selected.filter { it !in targets }
    if (extra.isNotEmpty()) {
      wrong(extra, step.wrong?.get(extra.first()) ?: step.wrongDefault)
      selected = selected.filter { it in targets }.toSet()
      return
    }
    if (step.targets.any { it !in selected }) {
      notice = Notice(res.getString(R.string.step_missing), res.getString(R.string.step_missing_body, selected.size, step.targets.size), true)
      fb.sfx(Sfx.Error); fb.haptic(Haptic.Reject)
      onMistake()
      return
    }
    onSolved(null)
  }

  DiagramCard {
    Box {
      DiagramCanvas(
        step.diagram, Modifier.fillMaxWidth(),
        tappable = if (solved) Tappable.None else step.tappable,
        onTap = { id, _ -> onTap(id) },
        selected = if (solved) targets else selected, errors = errors, success = solved,
        description = stringResource(R.string.step_tap_diagram),
      )
      if (step.mode == TapMode.All && !solved) {
        Text(
          "${selected.size} seleccionadas", Modifier.align(Alignment.TopEnd).clip(CircleShape).background(Cosmic.SurfaceStrong).border(1.dp, Cosmic.BorderStrong, CircleShape).padding(horizontal = 10.dp, vertical = 3.dp),
          color = Cosmic.Text, style = MaterialTheme.typography.labelMedium,
        )
      }
    }
  }
  NoticeSlot(notice)
  if (step.mode == TapMode.All && !solved) {
    AppButton(stringResource(R.string.step_check), ::check, Modifier.fillMaxWidth(), ButtonStyle.Primary, enabled = selected.isNotEmpty(), sound = null)
  }
  if (step.mode == TapMode.Any && !solved) {
    Text(stringResource(R.string.step_tap_help), Modifier.fillMaxWidth(), color = Cosmic.Text3, style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center)
  }
}

/* ---------------- Decode: multiple choice ---------------- */

@Composable
private fun ChoicePlayer(step: ChoiceStep, solved: Boolean, onMistake: () -> Unit, onSolved: (Diagram?) -> Unit) {
  val fb = LocalFeedback.current
  var wrongPicks by remember { mutableStateOf(emptySet<String>()) }
  var notice by remember { mutableStateOf<Notice?>(null) }
  val reduced = LocalReducedMotion.current
  val res = LocalResources.current

  fun pick(id: String) {
    if (solved || id in wrongPicks) return
    val o = step.options.first { it.id == id }
    if (o.correct) { notice = null; fb.sfx(Sfx.Select); onSolved(null) }
    else {
      wrongPicks = wrongPicks + id
      notice = Notice(res.getString(R.string.step_not_quite), o.feedback ?: res.getString(R.string.step_think_again), true)
      fb.sfx(Sfx.Error); fb.haptic(Haptic.Reject)
      onMistake()
    }
  }

  step.diagram?.let { d ->
    DiagramCard {
      if (step.playback) DiagramPlayback(d) else DiagramCanvas(d, Modifier.fillMaxWidth(), success = solved)
    }
  }
  step.diagrams?.let { ds ->
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
      ds.forEach { d ->
        DiagramCard(Modifier.weight(1f)) {
          Text(d.label, color = Cosmic.Text2, style = MaterialTheme.typography.labelMedium, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
          DiagramCanvas(d.diagram, Modifier.fillMaxWidth(), compact = true, showLabels = false)
        }
      }
    }
  }
  NoticeSlot(notice)
  val withDiagrams = step.options.any { it.diagram != null }
  val rows = if (withDiagrams) step.options.withIndex().chunked(2) else step.options.withIndex().map { listOf(it) }
  Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
    rows.forEach { row ->
      Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        row.forEach { (i, o) ->
          val correct = solved && o.correct
          val isWrong = o.id in wrongPicks
          val border by animateColorAsState(if (correct) Cosmic.Success else if (isWrong) Cosmic.Danger.copy(alpha = 0.6f) else Cosmic.Border, label = "b")
          val bg by animateColorAsState(if (correct) Cosmic.Success.copy(alpha = 0.14f) else if (isWrong) Cosmic.Danger.copy(alpha = 0.08f) else Cosmic.Surface, label = "bg")
          val appear = remember { Animatable(if (reduced) 1f else 0f) }
          LaunchedEffect(Unit) { if (!reduced) { kotlinx.coroutines.delay(i * 60L); appear.animateTo(1f, tween(320)) } }
          val shape = RoundedCornerShape(18.dp)
          Column(
            Modifier
              .weight(1f)
              .graphicsLayer { alpha = appear.value * (if (isWrong) 0.6f else 1f); translationY = (1 - appear.value) * 24f }
              .clip(shape)
              .background(bg)
              .border(if (correct) 2.dp else 1.dp, border, shape)
              .clickable(enabled = !solved && !isWrong, role = Role.Button) { pick(o.id) }
              .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            if (o.diagram != null) {
              Text(o.text, color = Cosmic.Text, style = MaterialTheme.typography.titleSmall, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
              DiagramCanvas(o.diagram!!, Modifier.fillMaxWidth(), compact = true, showLabels = false)
            } else {
              Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(
                  Modifier.size(32.dp).clip(RoundedCornerShape(10.dp)).background(if (correct) Cosmic.Success else if (isWrong) Cosmic.Danger.copy(alpha = 0.4f) else Cosmic.Surface2),
                  contentAlignment = Alignment.Center,
                ) {
                  Text(if (correct) "✓" else if (isWrong) "✕" else ('A' + i).toString(), fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = if (correct) Cosmic.Bg0 else Cosmic.Text)
                }
                Text(o.text, color = Cosmic.Text, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
              }
            }
          }
        }
        if (withDiagrams && row.size == 1) Box(Modifier.weight(1f))
      }
    }
  }
}

/* ---------------- Build / Debug ---------------- */

@Composable
private fun BuildPlayer(step: BuildStep, solved: Boolean, onMistake: () -> Unit, onSolved: (Diagram?) -> Unit) {
  val fb = LocalFeedback.current
  var diagram by remember { mutableStateOf(step.diagram) }
  var errors by remember { mutableStateOf(emptySet<String>()) }
  var notice by remember { mutableStateOf<Notice?>(null) }
  val language = LocalLanguage.current
  val noticeTitle = stringResource(R.string.step_notice)

  fun check() {
    val r = validate(diagram, step.validation)
    if (r.ok) { errors = emptySet(); notice = null; onSolved(diagram); return }
    val first = r.issues.first()
    val t = issueText(first, language)
    errors = r.issues.filter { it.layer == first.layer }.flatMap { it.elements }.toSet()
    notice = Notice(t.title, t.body, true)
    fb.sfx(Sfx.Error); fb.haptic(Haptic.Reject)
    onMistake()
  }

  step.reference?.let { ref ->
    Row(
      Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(Cosmic.Surface).border(1.dp, Cosmic.Border, RoundedCornerShape(18.dp)).padding(10.dp),
      verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      Text(ref.label, color = Cosmic.Text2, style = MaterialTheme.typography.labelMedium, modifier = Modifier.weight(1f))
      DiagramCanvas(ref.diagram, Modifier.widthIn(max = 130.dp), compact = true, showLabels = false)
    }
  }
  DiagramCard {
    DiagramEditor(
      diagram, onChange = { diagram = it; errors = emptySet(); notice = null },
      palette = step.palette, errors = errors, success = solved, disabled = solved,
      allowParallel = (step.validation.loops ?: 0) > 0,
      onNotice = { notice = Notice(noticeTitle, it, false) },
    )
  }
  NoticeSlot(notice)
  if (!solved) AppButton(stringResource(R.string.step_check), ::check, Modifier.fillMaxWidth(), ButtonStyle.Primary, large = true, sound = null)
}
