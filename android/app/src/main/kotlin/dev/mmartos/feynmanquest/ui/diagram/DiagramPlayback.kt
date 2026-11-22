package dev.mmartos.feynmanquest.ui.diagram

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mmartos.feynmanquest.R
import dev.mmartos.feynmanquest.core.content.narrate
import dev.mmartos.feynmanquest.core.engine.Diagram
import dev.mmartos.feynmanquest.core.engine.EdgeType
import dev.mmartos.feynmanquest.core.engine.Species
import dev.mmartos.feynmanquest.core.engine.nodeMap
import dev.mmartos.feynmanquest.core.engine.timeline
import dev.mmartos.feynmanquest.ui.LocalLanguage
import dev.mmartos.feynmanquest.ui.components.AppButton
import dev.mmartos.feynmanquest.ui.components.ButtonStyle
import dev.mmartos.feynmanquest.ui.components.IconSquare
import dev.mmartos.feynmanquest.ui.components.Icons24
import dev.mmartos.feynmanquest.ui.components.LineIcon
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.LocalReducedMotion
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.sign
import kotlinx.coroutines.delay

/** Milliseconds to advance one step in time, and pause at each vertex. */
private const val TRAVEL_MS = 900f
private const val HOLD_MS = 1700L
private val EaseOut = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)

/**
 * "Ver en el tiempo": reads a diagram as a story in time. Lines are drawn left
 * to right, particles travel along them and every vertex is narrated with its
 * charge balance. Can be played or stepped through.
 */
@Composable
fun DiagramPlayback(diagram: Diagram, modifier: Modifier = Modifier, autoPlay: Boolean = false, showLabels: Boolean = true) {
  val tl = remember(diagram) { timeline(diagram) }
  val nodes = remember(diagram) { diagram.nodeMap() }
  val paths = remember(diagram) {
    diagram.edges.associate { e ->
      val a = nodes.getValue(e.from).pt
      val b = nodes.getValue(e.to).pt
      e.id to curvePath(a, b, (e.bend ?: 0.0).toFloat())
    }
  }
  val steps = tl.events.size + 1
  val reduced = LocalReducedMotion.current
  val fb = LocalFeedback.current
  val start = if (autoPlay && !reduced) 0 else steps
  var tau by remember(diagram) { mutableFloatStateOf(start.toFloat()) }
  var target by remember(diagram) { mutableIntStateOf(start) }
  var playing by remember(diagram) { mutableStateOf(autoPlay && !reduced) }
  var started by remember(diagram) { mutableStateOf(autoPlay && !reduced) }
  var arrived by remember(diagram) { mutableIntStateOf(start) }
  var flash by remember(diagram) { mutableStateOf<String?>(null) }
  val ripple = remember { Animatable(1f) }

  LaunchedEffect(target, playing, reduced, diagram) {
    if (!reduced && tau != target.toFloat()) {
      var last = withFrameNanos { it }
      while (tau != target.toFloat()) {
        val now = withFrameNanos { it }
        val dir = sign(target - tau)
        var next = tau + dir * ((now - last) / 1_000_000f) / TRAVEL_MS
        last = now
        if ((dir > 0 && next >= target) || (dir < 0 && next <= target)) next = target.toFloat()
        tau = next
      }
    } else tau = target.toFloat()
    if (arrived != target) {
      arrived = target
      tl.events.getOrNull(target - 1)?.let {
        flash = it.vertex
        if (playing) fb.sfx(Sfx.Snap)
        if (!reduced) { ripple.snapTo(0f); ripple.animateTo(1f, tween(1100)) }
      }
    }
    if (playing) {
      if (target >= steps) playing = false
      else { delay(if (target == 0) 900 else HOLD_MS); target = minOf(steps, target + 1) }
    }
  }

  fun go(t: Int) { started = true; target = t.coerceIn(0, steps) }
  fun toggle() {
    started = true
    if (playing) { playing = false; return }
    if (target >= steps) { tau = 0f; arrived = 0; target = 0 }
    playing = true
  }

  // Reveal of each line and particles currently travelling.
  val reveal = HashMap<String, Reveal>()
  data class Particle(val at: Offset, val species: Species, val virtual: Boolean)
  val particles = mutableListOf<Particle>()
  for (t in tl.traversals) {
    val rs = tl.rank.getValue(t.start)
    val re = tl.rank.getValue(t.end)
    val p = ((tau - rs) / (if (re - rs == 0) 1 else re - rs)).coerceIn(0f, 1f)
    val fromStart = t.edge.from == t.start
    reveal[t.edge.id] = Reveal(p, fromStart)
    if (p > 0f && p < 1f) particles += Particle(pointAlong(paths.getValue(t.edge.id), if (fromStart) p else 1 - p), t.species, t.virtual)
  }
  val pending = tl.events.filter { tl.rank.getValue(it.vertex) > tau + 1e-4f }.map { it.vertex }.toSet()
  val frac = tau / steps
  val caption = narrate(tl, floor(tau + 1e-4f).toInt(), LocalLanguage.current)
  val idle = !started && !playing
  val measurer = rememberTextMeasurer()
  val flashNode = flash?.let { nodes[it] }

  Column(modifier, verticalArrangement = Arrangement.spacedBy(10.dp)) {
    DiagramCanvas(
      diagram, Modifier.fillMaxWidth(), showLabels = showLabels, reveal = reveal, pendingNodes = pending,
      description = stringResource(R.string.playback_description),
    ) {
      // Time cursor along the axis.
      drawLine(Cosmic.Accent, Offset(30f, 69.5f), Offset(30f + 40f * frac, 69.5f), 0.6f)
      drawCircle(Cosmic.Accent, 1.1f, Offset(30f + 40f * frac, 69.5f))
      if (flashNode != null && ripple.value < 1f) {
        for (k in 0..1) {
          val t = ((ripple.value * 1100f - k * 180f) / 900f).coerceIn(0f, 1f)
          if (t <= 0f) continue
          val e = EaseOut.transform(t)
          drawCircle(Color.White.copy(alpha = 0.95f * (1 - e)), 2.4f * (0.4f + 2.8f * e), flashNode.pt, style = Stroke(0.6f))
        }
      }
      for (p in particles) {
        val c = when (p.species) { Species.Electron -> Cosmic.Electron; Species.Positron -> Cosmic.Positron; Species.Photon -> Cosmic.Photon }
        val sign = when (p.species) { Species.Electron -> "−"; Species.Positron -> "+"; Species.Photon -> "" }
        drawCircle(c.copy(alpha = 0.35f), 3f, p.at)
        val r = if (sign.isNotEmpty()) 1.7f else 1.2f
        drawCircle(c.copy(alpha = if (p.virtual) 0.55f else 1f), r, p.at)
        drawCircle(Color.White, r, p.at, style = Stroke(0.35f, pathEffect = if (p.virtual) androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(0.5f, 0.4f)) else null))
        if (sign.isNotEmpty()) {
          drawLabelModel(measurer, sign, p.at)
        }
      }
    }

    Box(
      Modifier
        .fillMaxWidth()
        .heightIn(min = 124.dp)
        .clip(RoundedCornerShape(16.dp))
        .background(Cosmic.Surface)
        .border(1.dp, Cosmic.Border, RoundedCornerShape(16.dp))
        .padding(horizontal = 14.dp, vertical = 12.dp)
        .semantics { liveRegion = LiveRegionMode.Polite },
    ) {
      if (idle) {
        Text(stringResource(R.string.playback_hint), color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium)
      } else {
        AnimatedContent(caption, transitionSpec = { (fadeIn(tween(350)) + slideInVertically { it / 12 }) togetherWith fadeOut(tween(120)) }, label = "caption") { cap ->
          Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(cap.title.uppercase(), color = Cosmic.Accent2, fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = 13.sp, letterSpacing = 0.8.sp)
            Text(cap.text, color = Cosmic.Text, style = MaterialTheme.typography.bodyMedium)
            cap.charge?.let { ch ->
              Row(
                Modifier.padding(top = 4.dp).clip(CircleShape).background(Cosmic.Accent.copy(alpha = 0.18f)).border(1.dp, Cosmic.Accent.copy(alpha = 0.4f), CircleShape).padding(horizontal = 10.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically,
              ) {
                Text(stringResource(R.string.playback_charge, ch) + " ", color = Cosmic.Text, style = MaterialTheme.typography.labelMedium)
                Text("✓", color = Cosmic.Success, style = MaterialTheme.typography.labelMedium)
              }
            }
          }
        }
      }
    }

    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterHorizontally), verticalAlignment = Alignment.CenterVertically) {
      IconSquare({ go(ceil(tau - 1e-4f).toInt() - 1) }, stringResource(R.string.playback_prev), enabled = target > 0) { LineIcon(Icons24.Prev, stroke = 2f) }
      AppButton(
        text = stringResource(if (playing) R.string.playback_pause else if (tau >= steps) R.string.playback_watch else R.string.playback_resume),
        onClick = ::toggle, style = ButtonStyle.Primary,
        modifier = Modifier.heightIn(min = 44.dp),
        leading = { LineIcon(if (playing) Icons24.Pause else Icons24.Play, Modifier.size(18.dp), Color.White, stroke = 2.2f, fill = !playing) },
      )
      IconSquare({ go(floor(tau + 1e-4f).toInt() + 1) }, stringResource(R.string.playback_next), enabled = target < steps) { LineIcon(Icons24.Next, stroke = 2f) }
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally)) {
      repeat(steps + 1) { i ->
        val on = i <= tau + 1e-4f
        val w by animateDpAsState(if (abs(i - tau) < 0.5f) 16.dp else 6.dp, label = "dot")
        Box(Modifier.size(width = w, height = 6.dp).clip(CircleShape).background(if (on) Cosmic.Accent2 else Cosmic.Surface2))
      }
    }
  }
}

/** Draws the particle's charge sign. Called inside the model-scaled overlay. */
private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawLabelModel(
  measurer: androidx.compose.ui.text.TextMeasurer,
  text: String,
  at: Offset,
) {
  // Inside the overlay one unit = one model unit; draw a 2.4-unit glyph by
  // rendering at a large pixel size and scaling it down.
  val px = 48f
  val layout = measurer.measure(
    text,
    androidx.compose.ui.text.TextStyle(fontFamily = SpaceGrotesk, fontWeight = FontWeight.ExtraBold, fontSize = (px / (density * fontScale)).sp, color = Color(0xFF0B0D1A)),
  )
  val f = 2.4f / px
  scale(f, f, pivot = at) {
    drawText(layout, topLeft = Offset(at.x - layout.size.width / 2f, at.y - layout.size.height / 2f))
  }
}
