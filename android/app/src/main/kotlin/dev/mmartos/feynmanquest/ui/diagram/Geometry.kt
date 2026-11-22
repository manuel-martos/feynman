package dev.mmartos.feynmanquest.ui.diagram

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import dev.mmartos.feynmanquest.core.engine.DiagramNode
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

/* Diagram geometry in model units (viewBox 100 × 72). Port of src/ui/diagram/geometry.ts. */

const val VIEW_W = 100f
const val VIEW_H = 72f

val DiagramNode.pt: Offset get() = Offset(x.toFloat(), y.toFloat())

/** Control point of a quadratic curve bent perpendicular to a→b. */
fun controlPoint(a: Offset, b: Offset, bend: Float = 0f): Offset {
  val m = (a + b) / 2f
  val d = b - a
  return Offset(m.x - d.y * bend, m.y + d.x * bend)
}

fun quadAt(a: Offset, c: Offset, b: Offset, t: Float): Offset {
  val u = 1 - t
  return a * (u * u) + c * (2 * u * t) + b * (t * t)
}

fun quadTangent(a: Offset, c: Offset, b: Offset, t: Float): Offset {
  val v = (c - a) * (2 * (1 - t)) + (b - c) * (2 * t)
  val l = v.getDistance().takeIf { it > 0f } ?: 1f
  return v / l
}

fun curvePath(a: Offset, b: Offset, bend: Float = 0f): Path = Path().apply {
  moveTo(a.x, a.y)
  if (bend == 0f) lineTo(b.x, b.y)
  else {
    val c = controlPoint(a, b, bend)
    quadraticTo(c.x, c.y, b.x, b.y)
  }
}

/** Sinusoidal photon path whose amplitude tapers to zero at both ends. */
fun wavyPath(a: Offset, b: Offset, bend: Float = 0f, amplitude: Float = 1.6f, wavelength: Float = 4.2f): Path {
  val c = controlPoint(a, b, bend)
  val approxLen = hypot(b.x - a.x, b.y - a.y) * (1 + abs(bend) * 0.6f)
  val waves = max(2, (approxLen / wavelength).roundToInt())
  val steps = waves * 12
  return Path().apply {
    for (i in 0..steps) {
      val t = i.toFloat() / steps
      val p = quadAt(a, c, b, t)
      val tan = quadTangent(a, c, b, t)
      val taper = min(1f, min(t * 8, (1 - t) * 8))
      val off = sin(t * waves * PI.toFloat() * 2) * amplitude * taper
      val x = p.x - tan.y * off
      val y = p.y + tan.x * off
      if (i == 0) moveTo(x, y) else lineTo(x, y)
    }
  }
}

/** Arrow-head triangle centred at the curve midpoint, pointing a → b. */
fun arrowHead(a: Offset, b: Offset, bend: Float = 0f, size: Float = 2.4f): Path {
  val c = controlPoint(a, b, bend)
  val p = quadAt(a, c, b, 0.5f)
  val t = quadTangent(a, c, b, 0.5f)
  val n = Offset(-t.y, t.x)
  val tip = p + t * size
  val l = p - t * (size * 0.8f) + n * (size * 0.85f)
  val r = p - t * (size * 0.8f) - n * (size * 0.85f)
  return Path().apply { moveTo(tip.x, tip.y); lineTo(l.x, l.y); lineTo(r.x, r.y); close() }
}

/** Where a label should sit: off the midpoint, on the normal, preferably above. */
fun labelPoint(a: Offset, b: Offset, bend: Float = 0f, offset: Float = 4.5f): Offset {
  val c = controlPoint(a, b, bend)
  val p = quadAt(a, c, b, 0.5f)
  val t = quadTangent(a, c, b, 0.5f)
  var n = Offset(t.y, -t.x)
  if (n.y > 0) n = -n
  return p + n * offset
}

fun distToCurve(p: Offset, a: Offset, b: Offset, bend: Float = 0f): Float {
  val c = controlPoint(a, b, bend)
  var best = Float.MAX_VALUE
  for (i in 0..24) best = min(best, (quadAt(a, c, b, i / 24f) - p).getDistance())
  return best
}

/** If a straight line would run over another node, bend it around. */
fun clearBend(a: Offset, b: Offset, others: List<Offset>): Float {
  fun clearance(bend: Float) = others.minOfOrNull { distToCurve(it, a, b, bend) } ?: Float.MAX_VALUE
  if (clearance(0f) >= 4f) return 0f
  var best = 0f
  for (bend in listOf(0.2f, -0.2f, 0.3f, -0.3f, 0.45f, -0.45f)) if (clearance(bend) > clearance(best) + 0.5f) best = bend
  return best
}
