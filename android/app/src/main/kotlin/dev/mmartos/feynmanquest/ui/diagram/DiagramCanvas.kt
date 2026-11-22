package dev.mmartos.feynmanquest.ui.diagram

import androidx.annotation.StringRes
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
import dev.mmartos.feynmanquest.R
import dev.mmartos.feynmanquest.core.content.Tappable
import dev.mmartos.feynmanquest.core.engine.Diagram
import dev.mmartos.feynmanquest.core.engine.DiagramEdge
import dev.mmartos.feynmanquest.core.engine.EdgeRole
import dev.mmartos.feynmanquest.core.engine.EdgeType
import dev.mmartos.feynmanquest.core.engine.NodeKind
import dev.mmartos.feynmanquest.core.engine.Species
import dev.mmartos.feynmanquest.core.engine.edgeLabel
import dev.mmartos.feynmanquest.core.engine.edgeRole
import dev.mmartos.feynmanquest.core.engine.nodeMap
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.Inter
import dev.mmartos.feynmanquest.ui.theme.LocalReducedMotion
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk

/** Visual class of a line: what particle it shows. */
enum class EdgeKind(val color: Color, @StringRes val spoken: Int) {
  Electron(Cosmic.Electron, R.string.species_electron),
  Positron(Cosmic.Positron, R.string.species_positron),
  Photon(Cosmic.Photon, R.string.species_photon),
  Virtual(Cosmic.Virtual, R.string.species_virtual),
}

fun Diagram.edgeKind(e: DiagramEdge): EdgeKind {
  if (e.type == EdgeType.Photon) return EdgeKind.Photon
  if (edgeRole(e) == EdgeRole.Internal) return EdgeKind.Virtual
  val nodes = nodeMap()
  val a = nodes[e.from]
  val ext = if (a != null && a.kind != NodeKind.Vertex) a else nodes[e.to] ?: return EdgeKind.Virtual
  val arrowIn = e.from == ext.id
  val electron = if (ext.kind == NodeKind.In) arrowIn else !arrowIn
  return if (electron) EdgeKind.Electron else EdgeKind.Positron
}

fun Species.color() = when (this) { Species.Electron -> Cosmic.Electron; Species.Positron -> Cosmic.Positron; Species.Photon -> Cosmic.Photon }

/** Playback: how much of a line has been travelled (0–1), and from which end. */
data class Reveal(val p: Float, val fromStart: Boolean)

/** Maps between canvas pixels and diagram model units. */
fun DrawScope.diagramScale() = size.width / VIEW_W
fun toModel(px: Offset, widthPx: Float) = px / (widthPx / VIEW_W)

/** Topmost node or edge under a point (model units). */
fun Diagram.hit(p: Offset, tappable: Tappable): Pair<String, Boolean>? {
  val nodes = nodeMap()
  if (tappable == Tappable.Nodes || tappable == Tappable.All) {
    this.nodes.minByOrNull { (it.pt - p).getDistance() }?.let { if ((it.pt - p).getDistance() < 5.5f) return it.id to true }
  }
  if (tappable == Tappable.Edges || tappable == Tappable.All) {
    var best: DiagramEdge? = null
    var bestD = 4.5f
    for (e in edges) {
      val a = nodes[e.from] ?: continue
      val b = nodes[e.to] ?: continue
      val d = distToCurve(p, a.pt, b.pt, (e.bend ?: 0.0).toFloat())
      if (d < bestD) { bestD = d; best = e }
    }
    best?.let { return it.id to false }
  }
  return null
}

private val EaseOut = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)

private class Anim(
  val flow: State<Float>,
  val breathe: State<Float>,
)

/**
 * Renders a Feynman diagram on a Canvas. The same component draws static
 * diagrams, tap targets, the editor (with [overlay]) and the playback.
 */
@Composable
fun DiagramCanvas(
  diagram: Diagram,
  modifier: Modifier = Modifier,
  selected: Set<String> = emptySet(),
  errors: Set<String> = emptySet(),
  focus: Set<String>? = null,
  success: Boolean = false,
  showLabels: Boolean = true,
  showTags: Boolean = true,
  compact: Boolean = false,
  showTimeAxis: Boolean = !compact,
  snapNode: String? = null,
  activeNode: String? = null,
  socketHints: Boolean = false,
  reveal: Map<String, Reveal>? = null,
  pendingNodes: Set<String> = emptySet(),
  tappable: Tappable = Tappable.None,
  onTap: ((id: String, isNode: Boolean) -> Unit)? = null,
  description: String = stringResource(R.string.diagram_description),
  overlay: (DrawScope.() -> Unit)? = null,
) {
  val reduced = LocalReducedMotion.current
  val animate = !reduced && !compact
  val measurer = rememberTextMeasurer(cacheSize = 32)
  val nodes = remember(diagram) { diagram.nodeMap() }

  val res = LocalResources.current
  val timeLabel = stringResource(R.string.diagram_time)
  val infinite = rememberInfiniteTransition(label = "diagram")
  val flow = if (animate) infinite.animateFloat(0f, 1f, infiniteRepeatable(tween(1800, easing = LinearEasing)), label = "flow")
  else remember { mutableFloatStateOf(0f) }
  val breathe = if (animate) infinite.animateFloat(0f, 1f, infiniteRepeatable(tween(1400, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "breathe")
  else remember { mutableFloatStateOf(0f) }
  val anim = Anim(flow, breathe)

  // Success: lines are re-drawn one after another and the vertices burst.
  val successT = remember { Animatable(if (success) 1f else 0f) }
  LaunchedEffect(success) {
    if (success && !reduced) { successT.snapTo(0f); successT.animateTo(1f, tween(900 + 90 * diagram.edges.size + 600, easing = LinearEasing)) }
    else successT.snapTo(if (success) 1f else 0f)
  }
  // Errors shake briefly.
  val shake = remember { Animatable(0f) }
  LaunchedEffect(errors) {
    if (errors.isNotEmpty() && !reduced) {
      shake.snapTo(0f)
      shake.animateTo(0f, keyframes { durationMillis = 450; -0.8f at 90; 0.8f at 180; -0.5f at 270; 0.5f at 360 })
    }
  }

  val onTapState = rememberUpdatedState(onTap)
  val tapModifier = if (tappable != Tappable.None && onTap != null) {
    Modifier
      .pointerInput(diagram, tappable) {
        detectTapGestures { px ->
          diagram.hit(toModel(px, size.width.toFloat()), tappable)?.let { (id, isNode) -> onTapState.value?.invoke(id, isNode) }
        }
      }
      .semantics {
        customActions = buildList {
          if (tappable == Tappable.Edges || tappable == Tappable.All) diagram.edges.forEach { e ->
            add(CustomAccessibilityAction(res.getString(R.string.diagram_line, res.getString(diagram.edgeKind(e).spoken), diagram.edgeLabel(e))) { onTapState.value?.invoke(e.id, false); true })
          }
          if (tappable == Tappable.Nodes || tappable == Tappable.All) diagram.nodes.forEach { n ->
            val name = when (n.kind) { NodeKind.Vertex -> R.string.diagram_vertex; NodeKind.In -> R.string.diagram_initial; NodeKind.Out -> R.string.diagram_final }
            add(CustomAccessibilityAction(res.getString(name, n.tag ?: n.id)) { onTapState.value?.invoke(n.id, true); true })
          }
        }
      }
  } else Modifier

  Canvas(
    modifier
      .aspectRatio(VIEW_W / VIEW_H)
      .semantics { contentDescription = description }
      .then(tapModifier),
  ) {
    val s = diagramScale()
    val sx = shake.value * s
    translate(left = sx) {
      drawDiagram(
        diagram, nodes, s, measurer, anim, animate,
        selected, errors, focus, successT.value, success, showLabels, showTags, compact, showTimeAxis,
        snapNode, activeNode, socketHints, reveal, pendingNodes, timeLabel,
      )
      if (overlay != null) scale(s, s, pivot = Offset.Zero) { overlay() }
    }
  }
}

private fun DrawScope.drawDiagram(
  diagram: Diagram,
  nodes: Map<String, dev.mmartos.feynmanquest.core.engine.DiagramNode>,
  s: Float,
  measurer: TextMeasurer,
  anim: Anim,
  animate: Boolean,
  selected: Set<String>,
  errors: Set<String>,
  focus: Set<String>?,
  successT: Float,
  success: Boolean,
  showLabels: Boolean,
  showTags: Boolean,
  compact: Boolean,
  showTimeAxis: Boolean,
  snapNode: String?,
  activeNode: String?,
  socketHints: Boolean,
  reveal: Map<String, Reveal>?,
  pendingNodes: Set<String>,
  timeLabel: String,
) {
  fun dimmed(id: String) = focus != null && id !in focus
  val degree = HashMap<String, Int>().apply { diagram.edges.forEach { e -> merge(e.from, 1, Int::plus); merge(e.to, 1, Int::plus) } }

  // ---- time axis (model units, then text in pixels) ----
  if (showTimeAxis) {
    scale(s, s, pivot = Offset.Zero) {
      drawLine(Cosmic.Text3, Offset(30f, 69.5f), Offset(70f, 69.5f), 0.3f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(0.8f, 1f)))
      drawPath(Path().apply { moveTo(70f, 69.5f); lineTo(68f, 68.2f); lineTo(68f, 70.8f); close() }, Cosmic.Text3)
    }
    drawLabel(measurer, timeLabel, Offset(50f, 67.6f) * s, 2.3f * s, Cosmic.Text3, Inter, FontWeight.Medium, Anchor.Middle, letterSpacing = 0.3f * s)
  }

  // ---- edges ----
  scale(s, s, pivot = Offset.Zero) {
    diagram.edges.forEachIndexed { i, e ->
      val a = nodes[e.from]?.pt ?: return@forEachIndexed
      val b = nodes[e.to]?.pt ?: return@forEachIndexed
      val bend = (e.bend ?: 0.0).toFloat()
      val photon = e.type == EdgeType.Photon
      val path = if (photon) wavyPath(a, b, bend) else curvePath(a, b, bend)
      val kind = diagram.edgeKind(e)
      val color = when {
        e.id in errors -> Cosmic.Danger
        e.id in selected -> Color.White
        else -> kind.color
      }
      val alpha = if (dimmed(e.id)) 0.22f else 1f
      var width = if (photon) 0.75f else 0.9f
      when {
        compact -> width = 1.3f
        e.id in selected -> width = 1.8f
        e.id in errors -> width = 1.4f
        focus != null && e.id in focus -> width = 1.5f
        e.locked == false -> width = 1.05f
      }

      val r = reveal?.get(e.id)
      // Fraction of the line drawn: playback reveal, or the success re-draw.
      val (from, to) = when {
        reveal != null -> {
          val p = (r?.p ?: 1f).coerceIn(0f, 1f)
          if (r?.fromStart == false) (1 - p) to 1f else 0f to p
        }
        success && successT < 1f -> {
          val local = ((successT * (900f + 90 * diagram.edges.size + 600) - 90f * i) / 900f).coerceIn(0f, 1f)
          0f to EaseOut.transform(local)
        }
        else -> 0f to 1f
      }

      if (reveal != null) {
        drawPath(path, kind.color.copy(alpha = 0.2f * alpha), style = Stroke(0.35f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(0.5f, 1.4f))))
      }
      val visible = if (from == 0f && to == 1f) path else segment(path, from, to)
      if (!compact) {
        // Soft glow, like the SVG gaussian blur.
        drawPath(visible, color.copy(alpha = 0.10f * alpha), style = Stroke(width * 4.2f, cap = StrokeCap.Round, join = StrokeJoin.Round))
        drawPath(visible, color.copy(alpha = 0.22f * alpha), style = Stroke(width * 2.2f, cap = StrokeCap.Round, join = StrokeJoin.Round))
      }
      drawPath(visible, color.copy(alpha = alpha), style = Stroke(width, cap = StrokeCap.Round, join = StrokeJoin.Round))

      // Flowing sparkles along the line (shows direction of travel).
      if (reveal == null && !compact) {
        val (dash, gap, period) = if (photon) Triple(1.2f, 10f, 2.6f / 1.8f) else Triple(0.6f, 7f, 1f)
        val phase = -((anim.flow.value / period) % 1f) * 15.2f * (if (photon) 1.4f else 1f)
        drawPath(
          visible, Color.White.copy(alpha = (if (success) 0.9f else 0.55f) * alpha),
          style = Stroke(0.5f, cap = StrokeCap.Round, pathEffect = PathEffect.dashPathEffect(floatArrayOf(dash, gap), phase)),
        )
      }
      if (!photon) {
        val arrowAlpha = when {
          reveal != null -> if ((r?.p ?: 1f) > 0.55f) 1f else 0f
          success && successT < 1f -> if (to > 0.55f) 1f else 0f
          else -> 1f
        } * alpha
        if (arrowAlpha > 0f) {
          val head = arrowHead(a, b, bend, if (compact) 3f else 2.4f)
          drawPath(head, color.copy(alpha = arrowAlpha))
          drawPath(head, color.copy(alpha = arrowAlpha), style = Stroke(0.25f, join = StrokeJoin.Round))
        }
      }
    }
  }

  // ---- labels ----
  if (showLabels) {
    for (e in diagram.edges) {
      val a = nodes[e.from]?.pt ?: continue
      val b = nodes[e.to]?.pt ?: continue
      val p = labelPoint(a, b, (e.bend ?: 0.0).toFloat(), if (e.type == EdgeType.Photon) 5.2f else 4f)
      var alpha = if (dimmed(e.id)) 0.22f else 1f
      if (reveal != null && (reveal[e.id]?.p ?: 1f) < 0.5f) alpha = 0f
      if (alpha == 0f) continue
      val color = when { e.id in errors -> Cosmic.Danger; e.id in selected -> Color.White; else -> diagram.edgeKind(e).color }
      drawLabel(measurer, diagram.edgeLabel(e), Offset(p.x, p.y + 1.3f) * s, 4f * s, color.copy(alpha = alpha), SpaceGrotesk, FontWeight.Bold, Anchor.Middle, outline = 1.2f * s)
    }
  }

  // ---- nodes ----
  val breathe = anim.breathe.value
  for (n in diagram.nodes) {
    val c = n.pt * s
    val nodeAlpha = if (dimmed(n.id) || n.id in pendingNodes) 0.35f else 1f
    val deg = degree[n.id] ?: 0
    if (n.kind == NodeKind.Vertex) {
      val open = socketHints && deg < 3
      // Halo: breathing, or highlighted by interaction state.
      var haloColor = Cosmic.Accent
      var haloAlpha = if (animate) 0.16f + 0.14f * breathe else 0.18f
      var haloScale = if (animate) 1f + 0.25f * breathe else 1f
      when {
        n.id == snapNode -> { haloColor = Cosmic.Electron; haloAlpha = 0.55f; haloScale = 1.35f }
        n.id == activeNode -> { haloColor = Color.White; haloAlpha = 0.5f }
        n.id in errors -> { haloColor = Cosmic.Danger; haloAlpha = 0.4f }
        n.id in selected -> { haloColor = Color.White; haloAlpha = 0.4f }
        success -> {
          haloColor = Cosmic.Success
          val t = (successT * (900f + 90 * diagram.edges.size + 600) / 1200f).coerceIn(0f, 1f)
          if (t < 1f) {
            val e = EaseOut.transform(t)
            haloScale = if (e < 0.6f) 0.4f + (2.2f - 0.4f) * (e / 0.6f) else 2.2f - 1.2f * ((e - 0.6f) / 0.4f)
            haloAlpha = if (e < 0.6f) 0.9f - 0.65f * (e / 0.6f) else 0.25f - 0.05f * ((e - 0.6f) / 0.4f)
          }
        }
      }
      drawCircle(haloColor.copy(alpha = haloAlpha * nodeAlpha), 4.4f * s * haloScale, c)
      drawCircle(Cosmic.Bg1.copy(alpha = nodeAlpha), 2.6f * s, c)
      val ringColor = when { n.id in errors -> Cosmic.Danger; open -> Cosmic.Text2; else -> Color(0xFFDCD4FF) }
      drawCircle(
        ringColor.copy(alpha = nodeAlpha), 2.6f * s, c,
        style = Stroke((if (n.id in errors) 0.8f else 0.5f) * s, pathEffect = if (open) PathEffect.dashPathEffect(floatArrayOf(1f * s, 0.9f * s)) else null),
      )
      drawCircle((if (open) Cosmic.Text3 else Color.White).copy(alpha = nodeAlpha), 1.5f * s, c)
      if (open) {
        val sockets = 3 - deg
        for (k in 0 until sockets) drawCircle(Cosmic.Text3.copy(alpha = nodeAlpha), 0.6f * s, Offset(n.x.toFloat() - (sockets - 1) * 1.2f + k * 2.4f, n.y.toFloat() + 5.2f) * s)
      }
    } else {
      var haloColor = Cosmic.Text2
      var haloAlpha = 0.08f
      var haloScale = 1f
      when {
        n.id == snapNode -> { haloColor = Cosmic.Electron; haloAlpha = 0.55f; haloScale = 1.35f }
        n.id == activeNode -> { haloColor = Color.White; haloAlpha = 0.5f }
        n.id in selected -> { haloColor = Color.White; haloAlpha = 0.4f }
      }
      drawCircle(haloColor.copy(alpha = haloAlpha * nodeAlpha), 3.6f * s * haloScale, c)
      drawCircle(Cosmic.Bg1.copy(alpha = nodeAlpha), 1.4f * s, c)
      drawCircle((if (n.id in errors) Cosmic.Danger else Cosmic.Text2).copy(alpha = nodeAlpha), 1.4f * s, c, style = Stroke((if (n.id in errors) 0.8f else 0.45f) * s))
      val expect = n.expect
      if (socketHints && expect != null && deg == 0) {
        val sym = expect.symbol
        drawLabel(
          measurer, sym, Offset(n.x.toFloat() + if (n.kind == NodeKind.In) 5.5f else -5.5f, n.y.toFloat() - 3.4f) * s, 3.2f * s,
          expect.color().copy(alpha = 0.55f * nodeAlpha), SpaceGrotesk, FontWeight.Bold, Anchor.Middle,
        )
      }
      val tag = n.tag
      if (showTags && tag != null) {
        val inSide = n.kind == NodeKind.In
        drawLabel(
          measurer, tag, Offset(n.x.toFloat() + if (inSide) -3f else 3f, n.y.toFloat() + 1f) * s, 2.6f * s,
          Cosmic.Text3.copy(alpha = nodeAlpha), Inter, FontWeight.SemiBold, if (inSide) Anchor.End else Anchor.Start,
        )
      }
    }
  }
}

/** Portion [from, to] (fractions of length) of a path. */
private fun segment(path: Path, from: Float, to: Float): Path {
  val out = Path()
  if (to <= from) return out
  val m = PathMeasure()
  m.setPath(path, false)
  val len = m.length
  m.getSegment(from * len, to * len, out, true)
  return out
}

/** Point at a fraction of a path's length. */
fun pointAlong(path: Path, t: Float): Offset {
  val m = PathMeasure()
  m.setPath(path, false)
  return m.getPosition(t.coerceIn(0f, 1f) * m.length)
}

enum class Anchor { Start, Middle, End }

/** Draws text with its baseline at [at] (pixels), like SVG <text>. */
fun DrawScope.drawLabel(
  measurer: TextMeasurer,
  text: String,
  at: Offset,
  sizePx: Float,
  color: Color,
  family: FontFamily,
  weight: FontWeight,
  anchor: Anchor,
  outline: Float = 0f,
  letterSpacing: Float = 0f,
) {
  if (color.alpha <= 0f || sizePx <= 0f) return
  val style = TextStyle(
    fontFamily = family, fontWeight = weight, color = color,
    fontSize = pxToSp(sizePx), letterSpacing = if (letterSpacing > 0) pxToSp(letterSpacing) else TextUnit.Unspecified,
  )
  val layout: TextLayoutResult = measurer.measure(text, style)
  val x = when (anchor) { Anchor.Start -> at.x; Anchor.Middle -> at.x - layout.size.width / 2f; Anchor.End -> at.x - layout.size.width }
  val topLeft = Offset(x, at.y - layout.firstBaseline)
  if (outline > 0f) drawText(layout, color = Cosmic.Bg1.copy(alpha = color.alpha), topLeft = topLeft, drawStyle = Stroke(outline, join = StrokeJoin.Round))
  drawText(layout, topLeft = topLeft, drawStyle = Fill)
}

/** Text in the diagram scales with the drawing, never with the font-size setting. */
private fun Density.pxToSp(px: Float) = (px / (density * fontScale)).sp
