package dev.mmartos.feynmanquest.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.core.game.rankFor
import dev.mmartos.feynmanquest.ui.LocalBottomBarPadding
import dev.mmartos.feynmanquest.ui.Navigator
import dev.mmartos.feynmanquest.ui.components.AppButton
import dev.mmartos.feynmanquest.ui.components.ButtonStyle
import dev.mmartos.feynmanquest.ui.components.Eyebrow
import dev.mmartos.feynmanquest.ui.components.GlassCard
import dev.mmartos.feynmanquest.ui.components.MechanicBadge
import dev.mmartos.feynmanquest.ui.components.ProgressBar
import dev.mmartos.feynmanquest.ui.diagram.DiagramCanvas
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk

/** Scrollable page with the app's gutters, safe areas and room for the bottom bar. */
@Composable
fun Page(modifier: Modifier = Modifier, withBar: Boolean = true, gap: Dp = 16.dp, content: @Composable ColumnScope.() -> Unit) {
  val bottom = if (withBar) LocalBottomBarPadding.current.calculateBottomPadding() else 24.dp
  Box(modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
    Column(
      Modifier
        .widthIn(max = 560.dp)
        .fillMaxWidth()
        .verticalScroll(rememberScrollState())
        .windowInsetsPadding(WindowInsets.statusBars)
        .padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = bottom),
      verticalArrangement = Arrangement.spacedBy(gap),
      content = content,
    )
  }
}

/** The Feynman Quest mark (src/ui/components/Logo.tsx). */
@Composable
fun Logo(size: Dp, modifier: Modifier = Modifier) {
  Canvas(modifier.size(size)) {
    val k = this.size.width / 64f
    scale(k, k, pivot = Offset.Zero) {
      val round = androidx.compose.ui.geometry.CornerRadius(18f, 18f)
      drawRoundRect(Color(0xFF0D1236), Offset(2f, 2f), androidx.compose.ui.geometry.Size(60f, 60f), round)
      drawRoundRect(Brush.linearGradient(listOf(Cosmic.Accent, Cosmic.Electron), Offset.Zero, Offset(64f, 64f)), Offset(2f, 2f), androidx.compose.ui.geometry.Size(60f, 60f), round, style = Stroke(2f))
      val st = Stroke(3f, cap = StrokeCap.Round, join = StrokeJoin.Round)
      drawPath(Path().apply { moveTo(12f, 16f); lineTo(28f, 26f); lineTo(12f, 36f) }, Cosmic.Electron, style = st)
      drawPath(Path().apply { moveTo(52f, 16f); lineTo(36f, 26f); lineTo(52f, 36f) }, Cosmic.Positron, style = st)
      drawPath(Path().apply { moveTo(28f, 26f); quadraticTo(30f, 22f, 32f, 26f); quadraticTo(34f, 30f, 36f, 26f) }, Cosmic.Photon, style = st)
      drawCircle(Color.White, 3.2f, Offset(28f, 26f))
      drawCircle(Color.White, 3.2f, Offset(36f, 26f))
      for (x in listOf(15f, 21f, 27f, 33f, 39f, 45f)) drawCircle(Cosmic.Photon, 1.25f, Offset(x, 48f))
    }
  }
}

@Composable
fun HomeScreen(content: Content, state: GameState, nav: Navigator) {
  val next = state.nextLevel(content)
  val done = state.levelsDone
  val chapter = content.chapter(next?.chapter ?: content.chapters.last().id)!!
  val chColor = Cosmic.chapter(chapter.color)
  val rank = content.scoring.rankFor(state.xp)
  val fb = LocalFeedback.current

  Page {
    Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
      Logo(46.dp)
      Column {
        Text(
          buildAnnotatedString {
            append("Feynman ")
            withStyle(SpanStyle(brush = Cosmic.GradPrimary)) { append("Quest") }
          },
          style = MaterialTheme.typography.headlineMedium.copy(fontSize = 28.sp), color = Cosmic.Text,
          modifier = Modifier.semantics { heading() },
        )
        Text("Aprende el lenguaje del universo, una interacción cada vez.", color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium)
      }
    }

    // Hero: the next level, framed in the chapter colour.
    val heroShape = RoundedCornerShape(32.dp)
    Column(
      Modifier
        .fillMaxWidth()
        // Blurred and offset like the web's box-shadow. An elevation shadow here would show its
        // hard-edged core through the card's translucent background.
        .dropShadow(heroShape, Shadow(radius = 60.dp, color = chColor.copy(alpha = 0.6f), spread = (-30).dp, offset = DpOffset(0.dp, 30.dp)))
        .clip(heroShape)
        .background(Brush.verticalGradient(listOf(Color(0xE6151D4A), Color(0xE60C1130))))
        .drawBehind {
          drawRect(Brush.radialGradient(listOf(chColor.copy(alpha = 0.22f), Color.Transparent), Offset(size.width / 2, 0f), size.width * 0.9f))
        }
        .border(1.dp, chColor.copy(alpha = 0.4f), heroShape)
        .padding(20.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
      DiagramCanvas(content.art.home, Modifier.fillMaxWidth(), showLabels = false, description = "Diagrama de Feynman decorativo")
      if (next != null) {
        Eyebrow(if (done == 0) "Tu aventura empieza aquí" else "Capítulo ${chapter.id} · ${chapter.title}")
        Text("Nivel ${next.id}: ${next.title}", style = MaterialTheme.typography.headlineMedium, color = Cosmic.Text)
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
          MechanicBadge(next.mechanic)
          Text("${next.steps.size} ${if (next.steps.size == 1) "reto" else "retos"} · 2–5 min", color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium)
        }
        AppButton(if (done == 0) "Empezar" else "Continuar", { nav.level(next.id) }, Modifier.fillMaxWidth().padding(top = 6.dp), ButtonStyle.Primary, large = true)
      } else {
        Eyebrow("Campaña completada")
        Text("Hablas el lenguaje de Feynman", style = MaterialTheme.typography.headlineMedium, color = Cosmic.Text)
        AppButton("Entrenar en modo Dominio", nav::practice, Modifier.fillMaxWidth(), ButtonStyle.Primary, large = true)
      }
    }

    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
      Stat("${state.totalStars}", "de ${content.levels.size * 3} ★")
      Stat("$done", "de ${content.levels.size} niveles")
      Stat("${state.concepts.size}", "de ${content.concepts.size} conceptos")
    }

    GlassCard(Modifier.fillMaxWidth()) {
      Row(verticalAlignment = Alignment.Bottom) {
        Column(Modifier.weight(1f)) {
          Eyebrow("Rango")
          Text(rank.rank.title, fontFamily = SpaceGrotesk, fontSize = 19.sp, color = Cosmic.Text, style = MaterialTheme.typography.titleLarge)
        }
        Text("${state.xp} XP", color = Cosmic.Photon, style = MaterialTheme.typography.titleMedium)
      }
      ProgressBar(rank.progress, Modifier.fillMaxWidth())
      rank.next?.let { Text("${it.minXp - state.xp} XP para «${it.title}»", color = Cosmic.Text3, style = MaterialTheme.typography.bodySmall) }
    }

    val unlocked = state.mathUnlocked
    val shape = RoundedCornerShape(24.dp)
    Row(
      Modifier
        .fillMaxWidth()
        .clip(shape)
        .background(Cosmic.Surface)
        .border(1.dp, Cosmic.Border, shape)
        .clickable(enabled = unlocked, role = Role.Button) { fb.sfx(Sfx.Tap); nav.practice() }
        .padding(18.dp),
      horizontalArrangement = Arrangement.spacedBy(16.dp),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Box(Modifier.size(52.dp).clip(RoundedCornerShape(16.dp)).background(Cosmic.Accent.copy(alpha = 0.2f)), contentAlignment = Alignment.Center) {
        Text("∞", color = Cosmic.Virtual, fontSize = 28.sp, fontFamily = SpaceGrotesk)
      }
      Column(Modifier.weight(1f)) {
        Text("Modo Dominio", style = MaterialTheme.typography.titleMedium, color = if (unlocked) Cosmic.Text else Cosmic.Text2)
        Text(if (unlocked) "Repasa con diagramas nuevos generados al momento." else "Se desbloquea al completar el capítulo 1.", color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium)
      }
      Text(if (unlocked) "→" else "🔒", color = Cosmic.Text, fontSize = 18.sp)
    }
  }
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.Stat(value: String, label: String) {
  Column(
    Modifier
      .weight(1f)
      .clip(RoundedCornerShape(16.dp))
      .background(Cosmic.Surface)
      .border(1.dp, Cosmic.Border, RoundedCornerShape(16.dp))
      .padding(12.dp),
  ) {
    Text(value, fontFamily = SpaceGrotesk, fontSize = 24.sp, color = Cosmic.Text, style = MaterialTheme.typography.headlineSmall)
    Text(label, color = Cosmic.Text3, style = MaterialTheme.typography.bodySmall)
  }
}
