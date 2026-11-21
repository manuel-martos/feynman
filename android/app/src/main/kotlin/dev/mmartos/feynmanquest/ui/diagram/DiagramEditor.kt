package dev.mmartos.feynmanquest.ui.diagram

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import dev.mmartos.feynmanquest.core.engine.Diagram
import dev.mmartos.feynmanquest.core.engine.DiagramEdge
import dev.mmartos.feynmanquest.core.engine.EdgeType
import dev.mmartos.feynmanquest.core.engine.NodeKind
import dev.mmartos.feynmanquest.core.engine.degree
import dev.mmartos.feynmanquest.core.engine.nodeMap
import dev.mmartos.feynmanquest.ui.components.IconSquare
import dev.mmartos.feynmanquest.ui.components.Icons24
import dev.mmartos.feynmanquest.ui.components.LineIcon
import dev.mmartos.feynmanquest.ui.feedback.Haptic
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import kotlin.math.hypot

private const val NODE_GRAB = 8f
private const val SNAP = 10f
private const val BEND = 0.42f
private var edgeCounter = 0

/** Result of trying to connect two points: the new diagram, or why not. */
sealed interface ConnectResult {
  data class Ok(val diagram: Diagram) : ConnectResult
  data class Denied(val notice: String?) : ConnectResult
}

/** Pure connection rules of the editor (port of DiagramEditor.connect). */
fun connect(diagram: Diagram, from: String, to: String, tool: EdgeType, allowParallel: Boolean): ConnectResult {
  val nodes = diagram.nodeMap()
  val a = nodes[from] ?: return ConnectResult.Denied(null)
  val b = nodes[to] ?: return ConnectResult.Denied(null)
  if (a.isExternal && b.isExternal) return ConnectResult.Denied("Cada partícula externa debe llegar a un vértice: ahí es donde ocurre la interacción.")
  if (from == to) return ConnectResult.Denied(null)
  val parallel = diagram.edges.filter { (it.from == from && it.to == to) || (it.from == to && it.to == from) }
  if (parallel.isNotEmpty() && (!allowParallel || parallel.size >= 2 || a.isExternal || b.isExternal)) {
    return ConnectResult.Denied("Ya hay una línea entre esos dos puntos.")
  }
  for (id in listOf(from, to)) {
    val cap = if (nodes.getValue(id).kind == NodeKind.Vertex) 3 else 1
    if (diagram.degree(id) >= cap) {
      return ConnectResult.Denied(
        if (nodes.getValue(id).kind == NodeKind.Vertex) "Un vértice QED une exactamente tres líneas. Borra una para cambiarla."
        else "Cada partícula externa tiene una sola línea.",
      )
    }
  }
  var edges = diagram.edges
  val bend: Float
  if (parallel.isNotEmpty()) {
    // Two lines between the same vertices: curve them apart.
    val old = parallel[0]
    fun canon(f: String, t: String) = if (f < t) 1f else -1f
    var side = (old.bend ?: 0.0).toFloat() * canon(old.from, old.to)
    if (side == 0f) {
      side = -BEND
      if (old.locked == false) edges = edges.map { if (it === old) it.copy(bend = (side * canon(old.from, old.to)).toDouble()) else it }
    }
    bend = (if (side > 0) -BEND else BEND) * canon(from, to)
  } else {
    bend = clearBend(a.pt, b.pt, diagram.nodes.filter { it.id != from && it.id != to }.map { it.pt })
  }
  val edge = DiagramEdge("u${edgeCounter++}", tool, from, to, locked = false, bend = if (bend != 0f) bend.toDouble() else null)
  return ConnectResult.Ok(diagram.copy(edges = edges + edge))
}

/**
 * Interactive diagram builder: drag from one point to another (the arrow
 * follows the gesture), or tap two points. Tapping an editable line opens a
 * menu to flip its arrow or delete it. Undo and reset in the toolbar.
 */
@Composable
fun DiagramEditor(
  diagram: Diagram,
  onChange: (Diagram) -> Unit,
  palette: List<EdgeType>,
  modifier: Modifier = Modifier,
  errors: Set<String> = emptySet(),
  success: Boolean = false,
  disabled: Boolean = false,
  allowParallel: Boolean = false,
  onNotice: (String) -> Unit = {},
) {
  val fb = LocalFeedback.current
  val initial = remember { diagram }
  var tool by remember { mutableStateOf(palette.firstOrNull() ?: EdgeType.Fermion) }
  if (tool !in palette && palette.isNotEmpty()) tool = palette.first()
  var dragFrom by remember { mutableStateOf<String?>(null) }
  var dragTo by remember { mutableStateOf(Offset.Zero) }
  var dragMoved by remember { mutableStateOf(false) }
  var snap by remember { mutableStateOf<String?>(null) }
  var pending by remember { mutableStateOf<String?>(null) }
  var menuEdge by remember { mutableStateOf<String?>(null) }
  val history = remember { mutableStateListOf<Diagram>() }

  val current by rememberUpdatedState(diagram)
  val currentTool by rememberUpdatedState(tool)
  val isDisabled by rememberUpdatedState(disabled)

  fun commit(next: Diagram) {
    history.add(current)
    if (history.size > 30) history.removeAt(0)
    onChange(next)
  }

  fun tryConnect(from: String, to: String) {
    when (val r = connect(current, from, to, currentTool, allowParallel)) {
      is ConnectResult.Ok -> { fb.sfx(Sfx.Connect); fb.haptic(Haptic.Connect); commit(r.diagram) }
      is ConnectResult.Denied -> r.notice?.let { fb.sfx(Sfx.Deny); fb.haptic(Haptic.Reject); onNotice(it) }
    }
  }

  fun nearestNode(p: Offset, radius: Float, exclude: String? = null): String? =
    current.nodes.filter { it.id != exclude }.minByOrNull { hypot(it.x - p.x, it.y - p.y) }
      ?.takeIf { hypot(it.x - p.x, it.y - p.y) < radius }?.id

  fun edgeAt(p: Offset): DiagramEdge? {
    val nodes = current.nodeMap()
    return current.edges.mapNotNull { e ->
      val a = nodes[e.from] ?: return@mapNotNull null
      val b = nodes[e.to] ?: return@mapNotNull null
      e to distToCurve(p, a.pt, b.pt, (e.bend ?: 0.0).toFloat())
    }.filter { it.second < 3.6f }.minByOrNull { it.second }?.first
  }

  val nodes = diagram.nodeMap()
  Column(modifier, verticalArrangement = Arrangement.spacedBy(10.dp)) {
    BoxWithConstraints(Modifier.fillMaxWidth()) {
      val widthPx = constraints.maxWidth.toFloat()
      val gestures = Modifier.pointerInput(widthPx) {
        awaitEachGesture {
          val down = awaitFirstDown()
          if (isDisabled) return@awaitEachGesture
          val p = toModel(down.position, widthPx)
          menuEdge = null
          val hitNode = nearestNode(p, NODE_GRAB)
          if (hitNode == null) {
            val e = edgeAt(p)
            when {
              e == null -> pending = null
              e.locked != false -> { onNotice("Esta línea forma parte del enunciado y no se puede cambiar."); fb.sfx(Sfx.Deny); fb.haptic(Haptic.Reject) }
              else -> { menuEdge = e.id; fb.sfx(Sfx.Tap) }
            }
            return@awaitEachGesture
          }
          down.consume()
          fb.sfx(Sfx.Tap)
          dragFrom = hitNode
          dragTo = p
          dragMoved = false
          val start = current.nodeMap().getValue(hitNode).pt
          while (true) {
            val ev = awaitPointerEvent()
            val ch = ev.changes.firstOrNull { it.id == down.id } ?: break
            if (!ch.pressed) break
            ch.consume()
            val q = toModel(ch.position, widthPx)
            dragTo = q
            if (!dragMoved && (q - start).getDistance() > 3f) dragMoved = true
            val s = if (dragMoved) nearestNode(q, SNAP, hitNode) else null
            if (s != snap) {
              snap = s
              if (s != null) { fb.sfx(Sfx.Snap); fb.haptic(Haptic.Tick) }
            }
          }
          val target = snap
          when {
            dragMoved -> { if (target != null) tryConnect(hitNode, target); pending = null }
            pending != null && pending != hitNode -> { tryConnect(pending!!, hitNode); pending = null }
            else -> pending = if (pending == hitNode) null else hitNode
          }
          dragFrom = null
          snap = null
        }
      }

      val ghostFrom = dragFrom?.let { nodes[it]?.pt }
      val ghostTo = snap?.let { nodes[it]?.pt } ?: dragTo
      DiagramCanvas(
        diagram,
        Modifier.fillMaxWidth().then(gestures),
        errors = errors, success = success, snapNode = snap, activeNode = dragFrom ?: pending, socketHints = true,
        description = "Editor de diagrama: arrastra desde un punto a otro para trazar una línea",
      ) {
        if (ghostFrom != null && dragMoved) {
          if (tool == EdgeType.Photon) {
            drawPath(wavyPath(ghostFrom, ghostTo), Cosmic.Photon.copy(alpha = 0.85f), style = Stroke(0.9f, cap = StrokeCap.Round))
          } else {
            drawPath(curvePath(ghostFrom, ghostTo), Color.White.copy(alpha = 0.85f), style = Stroke(0.9f, cap = StrokeCap.Round, pathEffect = PathEffect.dashPathEffect(floatArrayOf(1.2f, 1.2f))))
            drawPath(arrowHead(ghostFrom, ghostTo), Color.White.copy(alpha = 0.85f))
          }
        }
      }

      // Line menu, anchored at the middle of the tapped line.
      val me = menuEdge?.let { id -> diagram.edges.firstOrNull { it.id == id } }
      if (me != null) {
        val a = nodes.getValue(me.from).pt
        val b = nodes.getValue(me.to).pt
        val mid = (a + b) / 2f
        val dpPerUnit = maxWidth / VIEW_W
        Box(Modifier.padding(start = dpPerUnit * mid.x, top = dpPerUnit * mid.y)) {
          DropdownMenu(
            expanded = true, onDismissRequest = { menuEdge = null },
            offset = DpOffset(0.dp, 0.dp), shape = RoundedCornerShape(16.dp), containerColor = Cosmic.SurfaceStrong,
          ) {
            if (me.type == EdgeType.Fermion) DropdownMenuItem(
              text = { Text("⇄  Invertir flecha", color = Cosmic.Text) },
              onClick = {
                commit(diagram.copy(edges = diagram.edges.map { if (it.id == me.id) it.copy(from = it.to, to = it.from) else it }))
                fb.sfx(Sfx.Connect); menuEdge = null
              },
            )
            DropdownMenuItem(
              text = { Text("✕  Borrar", color = Color(0xFFFFB3BA)) },
              onClick = {
                commit(diagram.copy(edges = diagram.edges.filter { it.id != me.id }))
                fb.sfx(Sfx.Remove); menuEdge = null
              },
            )
          }
        }
      }
    }

    // Toolbar: palette + undo/reset.
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
      palette.forEach { t ->
        val active = t == tool
        val c = if (t == EdgeType.Photon) Cosmic.Photon else Cosmic.Electron
        Column(
          Modifier
            .weight(1f)
            .clip(RoundedCornerShape(16.dp))
            .background(if (active) c.copy(alpha = 0.10f) else Cosmic.Surface)
            .border(if (active) 2.dp else 1.dp, if (active) c else Cosmic.BorderStrong, RoundedCornerShape(16.dp))
            .clickable(enabled = !disabled, role = Role.RadioButton) { tool = t; fb.sfx(Sfx.Tap) }
            .semantics { selected = active }
            .padding(vertical = 10.dp, horizontal = 6.dp),
          horizontalAlignment = Alignment.CenterHorizontally,
          verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
          androidx.compose.foundation.Canvas(Modifier.width(44.dp).height(16.dp)) {
            val k = size.width / 40f
            scale(k, k, pivot = Offset.Zero) {
              if (t == EdgeType.Photon) drawPath(wavyPath(Offset(3f, 7f), Offset(37f, 7f), 0f, 3f, 6.5f), c, style = Stroke(2.2f, cap = StrokeCap.Round))
              else {
                drawLine(c, Offset(3f, 7f), Offset(37f, 7f), 2.2f, StrokeCap.Round)
                drawPath(androidx.compose.ui.graphics.Path().apply { moveTo(24f, 7f); lineTo(16f, 2.5f); lineTo(16f, 11.5f); close() }, c)
              }
            }
          }
          Text(if (t == EdgeType.Photon) "Fotón" else "Electrón / positrón", color = Cosmic.Text, style = MaterialTheme.typography.labelMedium, textAlign = TextAlign.Center, maxLines = 2)
        }
      }
      IconSquare(
        onClick = { history.removeLastOrNull()?.let { onChange(it); fb.sfx(Sfx.Remove) } },
        label = "Deshacer", enabled = history.isNotEmpty() && !disabled, size = 48.dp,
      ) { LineIcon(Icons24.Undo) }
      IconSquare(
        onClick = { commit(initial); menuEdge = null; pending = null; fb.sfx(Sfx.Remove) },
        label = "Reiniciar diagrama", enabled = !disabled, size = 48.dp,
      ) { LineIcon(Icons24.Reset) }
    }
    Text(
      when {
        pending != null -> "Ahora toca el punto de destino."
        tool == EdgeType.Fermion -> "Arrastra entre dos puntos. La flecha sigue el sentido de tu gesto."
        else -> "Arrastra entre dos puntos para trazar un fotón."
      },
      Modifier.fillMaxWidth(), color = Cosmic.Text2, style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center,
    )
  }
}
