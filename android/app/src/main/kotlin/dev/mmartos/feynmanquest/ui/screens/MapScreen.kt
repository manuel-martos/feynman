package dev.mmartos.feynmanquest.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mmartos.feynmanquest.R
import dev.mmartos.feynmanquest.core.content.Chapter
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.content.Level
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.ui.LocalBottomBarPadding
import dev.mmartos.feynmanquest.ui.components.ProgressBar
import dev.mmartos.feynmanquest.ui.components.Stars
import dev.mmartos.feynmanquest.ui.components.icon
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.LocalReducedMotion
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk

private val OFFSETS = listOf(0, 34, 52, 34, 0, -34, -52, -34)

private sealed interface MapItem {
  data class Head(val chapter: Chapter) : MapItem
  data class Node(val chapter: Chapter, val level: Level, val index: Int) : MapItem
}

/** The campaign path: chapters, and their levels winding down the screen. */
@Composable
fun MapScreen(content: Content, state: GameState, focusChapter: Int?, onLevel: (Int) -> Unit) {
  val current = state.nextLevel(content)?.id
  val items = remember(content) {
    content.chapters.flatMap { ch -> listOf(MapItem.Head(ch)) + content.levelsOf(ch.id).mapIndexed { i, l -> MapItem.Node(ch, l, i) } }
  }
  val list = rememberLazyListState()
  LaunchedEffect(focusChapter, current) {
    val idx = when {
      focusChapter != null -> items.indexOfFirst { it is MapItem.Head && it.chapter.id == focusChapter }
      current != null -> (items.indexOfFirst { it is MapItem.Node && it.level.id == current } - 1).coerceAtLeast(0)
      else -> -1
    }
    if (idx > 0) list.scrollToItem(idx + 1)
  }
  val bottom = LocalBottomBarPadding.current.calculateBottomPadding()

  Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
    LazyColumn(
      Modifier.widthIn(max = 560.dp).fillMaxWidth().windowInsetsPadding(WindowInsets.statusBars),
      state = list,
      contentPadding = androidx.compose.foundation.layout.PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = bottom),
    ) {
      item("title") {
        Column(Modifier.padding(bottom = 16.dp)) {
          Text(stringResource(R.string.map_title), style = MaterialTheme.typography.displaySmall, color = Cosmic.Text, modifier = Modifier.semantics { heading() })
          Text(stringResource(R.string.map_summary, content.levels.size, content.chapters.size), color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium)
        }
      }
      items.forEach { item ->
        when (item) {
          is MapItem.Head -> item("ch${item.chapter.id}") { ChapterHead(content, state, item.chapter) }
          is MapItem.Node -> item("l${item.level.id}") {
            LevelNode(item, state, current == item.level.id, isLast = item.index == content.levelsOf(item.chapter.id).size - 1, onLevel)
          }
        }
      }
    }
  }
}

@Composable
private fun ChapterHead(content: Content, state: GameState, ch: Chapter) {
  val levels = content.levelsOf(ch.id)
  val unlocked = state.isUnlocked(levels.first().id)
  val done = levels.count { state.progress.containsKey(it.id) }
  val stars = levels.sumOf { state.progress[it.id]?.stars ?: 0 }
  val color = Cosmic.chapter(ch.color)
  val shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
  Column(
    Modifier
      .padding(top = 16.dp)
      .fillMaxWidth()
      .graphicsLayer { alpha = if (unlocked) 1f else 0.7f }
      .clip(shape)
      .background(Brush.verticalGradient(listOf(color.copy(alpha = if (unlocked) 0.10f else 0.04f), Color.Transparent)))
      .border(1.dp, Brush.verticalGradient(listOf(color.copy(alpha = if (unlocked) 0.35f else 0.15f), Color.Transparent)), shape)
      .padding(16.dp),
  ) {
    Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
      Box(
        Modifier.size(44.dp).shadow(if (unlocked) 12.dp else 0.dp, RoundedCornerShape(14.dp), spotColor = color, ambientColor = color)
          .clip(RoundedCornerShape(14.dp)).background(if (unlocked) color else lerp(color, Cosmic.Bg2, 0.7f)),
        contentAlignment = Alignment.Center,
      ) { Text("${ch.id}", fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = 21.sp, color = Cosmic.Bg1) }
      Column {
        Text(ch.title, style = MaterialTheme.typography.titleLarge, color = Cosmic.Text, modifier = Modifier.semantics { heading() })
        Text(if (unlocked) ch.goals else stringResource(R.string.map_chapter_locked), color = Cosmic.Text2, style = MaterialTheme.typography.bodySmall)
      }
    }
    Row(Modifier.padding(top = 14.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
      ProgressBar(done / levels.size.toFloat(), Modifier.weight(1f), brush = Brush.linearGradient(listOf(color, color)))
      Text("$done/${levels.size} · $stars★", color = Cosmic.Text2, style = MaterialTheme.typography.labelMedium)
    }
  }
}

@Composable
private fun LevelNode(item: MapItem.Node, state: GameState, isCurrent: Boolean, isLast: Boolean, onLevel: (Int) -> Unit) {
  val l = item.level
  val open = state.isUnlocked(l.id)
  val p = state.progress[l.id]
  val color = Cosmic.chapter(item.chapter.color)
  val fb = LocalFeedback.current
  val reduced = LocalReducedMotion.current
  val source = remember { MutableInteractionSource() }
  val pressed by source.collectIsPressedAsState()
  val appear = remember { Animatable(if (reduced) 1f else 0.5f) }
  LaunchedEffect(Unit) { if (!reduced) appear.animateTo(1f, spring(dampingRatio = 0.5f, stiffness = Spring.StiffnessMediumLow)) }
  val ring = if (isCurrent && !reduced) rememberInfiniteTransition(label = "ring").animateFloat(0f, 1f, infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Restart), label = "ring").value else -1f

  val (top, bottomC, ledge) = when {
    !open -> Triple(Color(0xFF1A2150), Color(0xFF1A2150), Color(0xFF0C1030))
    p != null -> Triple(Color(0xFFFFF6D6), Color(0xFFC98A00), Color(0xFF8A5D00))
    else -> Triple(lerp(color, Color.White, 0.25f), lerp(color, Color.Black, 0.3f), lerp(color, Color.Black, 0.5f))
  }
  val name = stringResource(R.string.map_level, l.id, l.title)
  val label = when { p != null -> stringResource(R.string.map_level_stars, name, p.stars); !open -> stringResource(R.string.map_level_locked, name); else -> name }

  Column(
    Modifier.fillMaxWidth().padding(top = 18.dp, bottom = if (isLast) 12.dp else 0.dp).offset(x = OFFSETS[(l.id - 1) % OFFSETS.size].dp),
    horizontalAlignment = Alignment.CenterHorizontally,
  ) {
    Box(
      Modifier
        .graphicsLayer { scaleX = appear.value; scaleY = appear.value; alpha = ((appear.value - 0.5f) * 2f).coerceIn(0f, 1f) }
        .size(72.dp)
        .drawBehind {
          if (ring >= 0f) {
            val s = 0.9f + 0.45f * ring
            drawCircle(color.copy(alpha = 1f - ring), size.width / 2 * s + 8.dp.toPx() * s, style = Stroke(3.dp.toPx()))
          }
          if (open) drawCircle(Brush.radialGradient(listOf(color.copy(alpha = 0.5f), Color.Transparent), center + Offset(0f, 12.dp.toPx()), size.width * 0.8f), size.width * 0.8f, center + Offset(0f, 12.dp.toPx()))
          // The "ledge" under the button that disappears when pressed.
          if (!pressed) drawCircle(ledge, size.width / 2, center + Offset(0f, 6.dp.toPx()))
        }
        .offset(y = if (pressed) 4.dp else 0.dp)
        .clip(CircleShape)
        .drawBehind { drawCircle(Brush.radialGradient(listOf(top, bottomC), center = Offset(size.width * 0.35f, size.height * 0.3f), radius = size.width * 0.8f)) }
        .clickable(source, indication = null, enabled = open, role = Role.Button) { fb.sfx(Sfx.Tap); onLevel(l.id) }
        .semantics { contentDescription = label },
      contentAlignment = Alignment.Center,
    ) {
      Text(if (open) "${l.id}" else "🔒", fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = if (open) 24.sp else 18.sp, color = Cosmic.Bg1.copy(alpha = if (open) 1f else 0.6f))
    }
    // Mechanic badge on the node's corner.
    Box(Modifier.offset(x = 26.dp, y = (-26).dp).size(26.dp).clip(CircleShape).background(Cosmic.Bg2).border(2.dp, if (open) color else Cosmic.Text3, CircleShape), contentAlignment = Alignment.Center) {
      Text(l.mechanic.icon, color = if (open) color else Cosmic.Text3, fontSize = 11.sp)
    }
    Column(Modifier.offset(y = (-16).dp).widthIn(max = 170.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
      Text(l.title, color = Cosmic.Text2, style = MaterialTheme.typography.labelMedium, textAlign = TextAlign.Center)
      if (p != null) Stars(p.stars, size = 12.dp)
      if (isCurrent) Text(stringResource(R.string.map_next), color = color, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 1.1.sp)
    }
  }
}
