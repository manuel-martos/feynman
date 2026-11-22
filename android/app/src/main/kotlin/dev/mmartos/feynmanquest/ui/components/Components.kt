package dev.mmartos.feynmanquest.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.layout.layout
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.offset
import androidx.compose.ui.unit.sp
import dev.mmartos.feynmanquest.core.content.Explanation
import dev.mmartos.feynmanquest.core.content.Mechanic
import dev.mmartos.feynmanquest.core.game.Layer
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.Inter
import dev.mmartos.feynmanquest.ui.theme.LocalReducedMotion
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk
import kotlin.random.Random

/** The "cosmos" backdrop: three soft nebulae over a vertical gradient, plus faint stars. */
@Composable
fun CosmicBackground(modifier: Modifier = Modifier, content: @Composable BoxScope.() -> Unit) {
  val stars = remember { List(70) { Triple(Random(it).nextFloat(), Random(it * 7 + 3).nextFloat(), Random(it * 13 + 1).nextFloat()) } }
  Box(
    modifier
      .fillMaxSize()
      .drawBehind {
        drawRect(Brush.verticalGradient(listOf(Cosmic.Bg1, Cosmic.Bg0)))
        fun nebula(cx: Float, cy: Float, r: Float, c: Color) =
          drawCircle(Brush.radialGradient(listOf(c, Color.Transparent), Offset(cx, cy), r), r, Offset(cx, cy))
        nebula(size.width * 0.8f, -size.height * 0.05f, size.width * 1.1f, Cosmic.Accent.copy(alpha = 0.28f))
        nebula(-size.width * 0.1f, size.height * 1.05f, size.width * 0.95f, Cosmic.Electron.copy(alpha = 0.16f))
        nebula(size.width * 1.1f, size.height * 0.7f, size.width * 0.7f, Cosmic.Positron.copy(alpha = 0.10f))
        for ((x, y, b) in stars) drawCircle(Color.White.copy(alpha = 0.08f + 0.25f * b), 0.6.dp.toPx() + b * 0.6.dp.toPx(), Offset(x * size.width, y * size.height))
      },
    content = content,
  )
}

/**
 * Lets a full-width child extend [gutter] past its parent's horizontal padding on both sides, e.g. a
 * horizontally scrolling row that should run to the screen edge instead of being cut at the gutter.
 */
fun Modifier.bleedHorizontally(gutter: Dp): Modifier = layout { measurable, constraints ->
  val px = gutter.roundToPx()
  val placeable = measurable.measure(constraints.offset(horizontal = 2 * px))
  layout(placeable.width - 2 * px, placeable.height) { placeable.place(-px, 0) }
}

/** Press feedback: a small spring scale, like `.btn:active { scale(.97) }`. */
@Composable
fun Modifier.pressScale(source: MutableInteractionSource, pressed: Float = 0.97f): Modifier {
  val isPressed by source.collectIsPressedAsState()
  val s by animateFloatAsState(if (isPressed) pressed else 1f, spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium), label = "press")
  return this.scale(s)
}

enum class ButtonStyle { Primary, Success, Secondary, Ghost, Danger, DangerGhost }

@Composable
fun AppButton(
  text: String,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
  style: ButtonStyle = ButtonStyle.Secondary,
  large: Boolean = false,
  enabled: Boolean = true,
  sound: Sfx? = Sfx.Tap,
  leading: (@Composable RowScope.() -> Unit)? = null,
) {
  val fb = LocalFeedback.current
  val source = remember { MutableInteractionSource() }
  val shape = RoundedCornerShape(if (large) 18.dp else 16.dp)
  val (bg, fg, border) = when (style) {
    ButtonStyle.Primary -> Triple(Cosmic.GradPrimary, Color.White, null)
    ButtonStyle.Success -> Triple(Cosmic.GradSuccess, Color(0xFF04241A), null)
    ButtonStyle.Secondary -> Triple(Brush.linearGradient(listOf(Cosmic.Surface2, Cosmic.Surface2)), Cosmic.Text, Cosmic.BorderStrong)
    ButtonStyle.Ghost -> Triple(null, Cosmic.Text, Cosmic.BorderStrong)
    ButtonStyle.Danger -> Triple(Brush.linearGradient(listOf(Cosmic.Danger.copy(alpha = 0.18f), Cosmic.Danger.copy(alpha = 0.18f))), Color(0xFFFFB3BA), Cosmic.Danger.copy(alpha = 0.5f))
    ButtonStyle.DangerGhost -> Triple(null, Color(0xFFFFB3BA), Cosmic.Danger.copy(alpha = 0.5f))
  }
  // Soft coloured glow under filled buttons, mirroring the web's box-shadow. A blurred drop shadow
  // fades out on its own, so it never shows a hard edge the way a gradient in a fixed rect did.
  val glow = when (style) {
    ButtonStyle.Primary -> Shadow(radius = 40.dp, color = Cosmic.Accent.copy(alpha = 0.55f), spread = (-10).dp, offset = DpOffset(0.dp, 12.dp))
    ButtonStyle.Success -> Shadow(radius = 30.dp, color = Cosmic.Success.copy(alpha = 0.6f), spread = (-10).dp, offset = DpOffset(0.dp, 12.dp))
    else -> null
  }
  Row(
    modifier
      .pressScale(source)
      .graphicsLayer { alpha = if (enabled) 1f else 0.45f }
      .heightIn(min = if (large) 56.dp else 48.dp)
      .then(if (glow != null && enabled) Modifier.dropShadow(shape, glow) else Modifier)
      .clip(shape)
      .then(if (bg != null) Modifier.background(bg) else Modifier)
      .then(if (border != null) Modifier.border(1.dp, border, shape) else if (style == ButtonStyle.Primary) Modifier.border(1.dp, Color.White.copy(alpha = 0.18f), shape) else Modifier)
      .clickable(source, indication = androidx.compose.material3.ripple(color = fg), enabled = enabled, role = Role.Button) {
        sound?.let(fb::sfx)
        onClick()
      }
      .padding(horizontal = 20.dp, vertical = 10.dp),
    horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    leading?.invoke(this)
    Text(text, color = fg, style = MaterialTheme.typography.labelLarge.copy(fontSize = if (large) 17.sp else 16.sp, fontWeight = FontWeight.Bold), textAlign = TextAlign.Center)
  }
}

/** Square icon button (`.icon-btn`). */
@Composable
fun IconSquare(
  onClick: () -> Unit,
  label: String,
  modifier: Modifier = Modifier,
  enabled: Boolean = true,
  size: Dp = 44.dp,
  tint: Color = Cosmic.Text,
  background: Color = Cosmic.Surface,
  borderColor: Color = Cosmic.Border,
  content: @Composable BoxScope.() -> Unit,
) {
  val fb = LocalFeedback.current
  val source = remember { MutableInteractionSource() }
  val shape = RoundedCornerShape(if (size < 40.dp) 10.dp else 14.dp)
  Box(
    modifier
      .pressScale(source, 0.94f)
      .size(size)
      .graphicsLayer { alpha = if (enabled) 1f else 0.4f }
      .clip(shape)
      .background(background)
      .border(1.dp, borderColor, shape)
      .clickable(source, androidx.compose.material3.ripple(color = tint), enabled = enabled, role = Role.Button) { fb.sfx(Sfx.Tap); onClick() }
      .semantics { contentDescription = label },
    contentAlignment = Alignment.Center,
  ) {
    androidx.compose.runtime.CompositionLocalProvider(androidx.compose.material3.LocalContentColor provides tint) { content() }
  }
}

/** `.card`: translucent surface with a hairline border. */
@Composable
fun GlassCard(
  modifier: Modifier = Modifier,
  shape: Shape = RoundedCornerShape(24.dp),
  background: Brush = Brush.linearGradient(listOf(Cosmic.Surface, Cosmic.Surface)),
  border: Color = Cosmic.Border,
  padding: Dp = 18.dp,
  content: @Composable ColumnScope.() -> Unit,
) {
  Column(
    modifier.clip(shape).background(background).border(1.dp, border, shape).padding(padding),
    verticalArrangement = Arrangement.spacedBy(12.dp),
    content = content,
  )
}

@Composable
fun Eyebrow(text: String, modifier: Modifier = Modifier, color: Color = Cosmic.Text3) {
  Text(text.uppercase(), modifier, color = color, style = MaterialTheme.typography.labelSmall.copy(fontFamily = Inter, fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 1.7.sp))
}

/** Progress bar (`.bar`). */
@Composable
fun ProgressBar(fraction: Float, modifier: Modifier = Modifier, brush: Brush = Cosmic.GradPrimary, height: Dp = 8.dp) {
  val f by animateFloatAsState(fraction.coerceIn(0f, 1f), label = "bar")
  Box(modifier.height(height).clip(CircleShape).background(Color.White.copy(alpha = 0.08f))) {
    Box(Modifier.fillMaxWidth(f).height(height).clip(CircleShape).background(brush))
  }
}

private val StarPath = "M12 2.6l2.83 5.74 6.33.92-4.58 4.47 1.08 6.3L12 17.05l-5.66 2.98 1.08-6.3L2.84 9.26l6.33-.92z"

@Composable
fun Star(filled: Boolean, size: Dp, modifier: Modifier = Modifier, popDelayMs: Int? = null) {
  val reduced = LocalReducedMotion.current
  val scale = remember { Animatable(if (popDelayMs != null && !reduced) 0f else 1f) }
  LaunchedEffect(popDelayMs) {
    if (popDelayMs != null && !reduced) {
      kotlinx.coroutines.delay(popDelayMs.toLong())
      scale.animateTo(1f, spring(dampingRatio = 0.45f, stiffness = Spring.StiffnessLow))
    }
  }
  val path = remember { androidx.compose.ui.graphics.vector.PathParser().parsePathString(StarPath).toPath() }
  Canvas(modifier.size(size).graphicsLayer { scaleX = scale.value; scaleY = scale.value }) {
    val k = this.size.width / 24f
    scale(k, k, pivot = Offset.Zero) {
      if (filled) {
        drawPath(path, Cosmic.Photon)
      } else {
        drawPath(path, Color.White.copy(alpha = 0.10f))
        drawPath(path, Cosmic.Text3, style = Stroke(1.4f))
      }
    }
  }
}

@Composable
fun Stars(value: Int, modifier: Modifier = Modifier, size: Dp = 16.dp, animate: Boolean = false) {
  Row(modifier.semantics { contentDescription = "$value de 3 estrellas" }, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
    repeat(3) { i -> Star(i < value, size, popDelayMs = if (animate) 350 + i * 260 else null) }
  }
}

val Mechanic.label get() = when (this) { Mechanic.Decode -> "Decode"; Mechanic.Build -> "Build"; Mechanic.Debug -> "Debug" }
val Mechanic.hint get() = when (this) { Mechanic.Decode -> "Descifra el diagrama"; Mechanic.Build -> "Construye la interacción"; Mechanic.Debug -> "Encuentra el error" }
val Mechanic.icon get() = when (this) { Mechanic.Decode -> "◉"; Mechanic.Build -> "✦"; Mechanic.Debug -> "⚠" }
val Mechanic.color get() = when (this) { Mechanic.Decode -> Cosmic.Electron; Mechanic.Build -> Cosmic.Photon; Mechanic.Debug -> Cosmic.Positron }

/** Pill badge (`.badge`). */
@Composable
fun Badge(text: String, color: Color, modifier: Modifier = Modifier, icon: String? = null, sub: String? = null) {
  Row(
    modifier
      .clip(CircleShape)
      .background(color.copy(alpha = 0.10f))
      .border(1.5.dp, color.copy(alpha = 0.85f), CircleShape)
      .padding(horizontal = 12.dp, vertical = 5.dp),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    if (icon != null) Text("$icon ", color = color, fontSize = 13.sp)
    Text(text.uppercase(), color = color, fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = 14.sp, letterSpacing = 0.9.sp)
    if (sub != null) Text("  · $sub", color = color, fontFamily = Inter, fontWeight = FontWeight.Medium, fontSize = 14.sp)
  }
}

@Composable
fun MechanicBadge(mechanic: Mechanic, modifier: Modifier = Modifier, long: Boolean = false) =
  Badge(mechanic.label, mechanic.color, modifier, icon = mechanic.icon, sub = if (long) mechanic.hint else null)

private data class Tab(val layer: Layer, val label: String, val q: String)
private val TABS = listOf(
  Tab(Layer.Intuitive, "Intuitiva", "¿Qué estoy viendo?"),
  Tab(Layer.Scientific, "Científica", "¿Qué significa físicamente?"),
  Tab(Layer.Math, "Matemática", "¿Cómo se expresa matemáticamente?"),
)

/** Three-layer explanation (intuitive / scientific / mathematical). */
@Composable
fun ExplanationTabs(ex: Explanation, mathUnlocked: Boolean, onView: (Layer) -> Unit, modifier: Modifier = Modifier) {
  var tab by remember { mutableStateOf(Layer.Intuitive) }
  val fb = LocalFeedback.current
  Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
    Row(
      Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color.Black.copy(alpha = 0.25f)).padding(4.dp),
      horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
      // The math layer stays hidden until it's unlocked (level 5), rather than shown as a dead tab.
      TABS.filter { it.layer != Layer.Math || mathUnlocked }.forEach { t ->
        val active = tab == t.layer
        Box(
          Modifier
            .weight(1f)
            .clip(RoundedCornerShape(10.dp))
            .background(if (active) Cosmic.Accent.copy(alpha = 0.32f) else Color.Transparent)
            .clickable(role = Role.Tab) { tab = t.layer; onView(t.layer); fb.sfx(Sfx.Tap) }
            .semantics { selected = active }
            .padding(vertical = 9.dp),
          contentAlignment = Alignment.Center,
        ) {
          Text(
            t.label,
            color = if (active) Cosmic.Text else Cosmic.Text2,
            style = MaterialTheme.typography.labelMedium,
            maxLines = 1,
          )
        }
      }
    }
    AnimatedContent(tab, transitionSpec = { fadeIn() togetherWith fadeOut() }, label = "tab") { layer ->
      val t = TABS.first { it.layer == layer }
      Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(t.q, color = Cosmic.Accent2, style = MaterialTheme.typography.titleSmall)
        Text(
          when (layer) { Layer.Intuitive -> ex.intuitive; Layer.Scientific -> ex.scientific; Layer.Math -> ex.math },
          color = Cosmic.Text, style = MaterialTheme.typography.bodyLarge,
        )
      }
    }
  }
}

/** Feedback message under a puzzle (`.feedback`). */
@Composable
fun FeedbackBanner(title: String, body: String, error: Boolean, modifier: Modifier = Modifier) {
  val c = if (error) Cosmic.Danger else Cosmic.Accent2
  Column(
    modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(16.dp))
      .background(c.copy(alpha = 0.12f))
      .border(1.dp, c.copy(alpha = 0.45f), RoundedCornerShape(16.dp))
      .padding(horizontal = 14.dp, vertical = 12.dp),
    verticalArrangement = Arrangement.spacedBy(2.dp),
  ) {
    Text(title, color = if (error) Color(0xFFFFB3BA) else Cosmic.Accent2, style = MaterialTheme.typography.titleSmall)
    Text(body, color = Cosmic.Text, style = MaterialTheme.typography.bodyMedium)
  }
}

/** Small pill chip (filters). */
@Composable
fun Chip(text: String, active: Boolean, onClick: () -> Unit) {
  val fb = LocalFeedback.current
  Box(
    Modifier
      .clip(CircleShape)
      .background(if (active) Cosmic.Text else Cosmic.Surface)
      .border(1.dp, if (active) Cosmic.Text else Cosmic.Border, CircleShape)
      .clickable(role = Role.Tab) { fb.sfx(Sfx.Tap); onClick() }
      .semantics { selected = active }
      .padding(horizontal = 16.dp, vertical = 8.dp),
  ) {
    Text(text, color = if (active) Cosmic.Bg1 else Cosmic.Text2, style = MaterialTheme.typography.labelMedium)
  }
}

@Composable
fun Gap(h: Dp) = Spacer(Modifier.height(h))

@Composable
fun HGap(w: Dp) = Spacer(Modifier.width(w))

/** A filled path from an SVG `d` string, scaled from a 24×24 box (line icons). */
@Composable
fun LineIcon(d: String, modifier: Modifier = Modifier.size(20.dp), color: Color = androidx.compose.material3.LocalContentColor.current, stroke: Float = 1.8f, fill: Boolean = false) {
  val path: Path = remember(d) { androidx.compose.ui.graphics.vector.PathParser().parsePathString(d).toPath() }
  Canvas(modifier) {
    val k = size.width / 24f
    scale(k, k, pivot = Offset.Zero) {
      if (fill) drawPath(path, color)
      else drawPath(path, color, style = Stroke(stroke, cap = androidx.compose.ui.graphics.StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round))
    }
  }
}

object Icons24 {
  const val Undo = "M9 14 4 9l5-5 M4 9h10.5a5.5 5.5 0 0 1 0 11H11"
  const val Reset = "M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5"
  const val Bulb = "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V17h5v-1.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"
  const val Close = "M6 6l12 12M18 6L6 18"
  const val Back = "M19 12H5M11 6l-6 6 6 6"
  const val Prev = "M15 6l-6 6 6 6"
  const val Next = "M9 6l6 6-6 6"
  const val Play = "M7 4.5v15l12-7.5z"
  const val Pause = "M8 5v14M16 5v14"
  const val Arrow = "M5 12h14M13 6l6 6-6 6"
}
