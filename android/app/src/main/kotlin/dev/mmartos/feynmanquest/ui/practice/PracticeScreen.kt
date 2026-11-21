package dev.mmartos.feynmanquest.ui.practice

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.ui.Navigator
import dev.mmartos.feynmanquest.ui.components.AppButton
import dev.mmartos.feynmanquest.ui.components.Badge
import dev.mmartos.feynmanquest.ui.components.ButtonStyle
import dev.mmartos.feynmanquest.ui.components.IconSquare
import dev.mmartos.feynmanquest.ui.components.Icons24
import dev.mmartos.feynmanquest.ui.components.LineIcon
import dev.mmartos.feynmanquest.ui.feedback.Haptic
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.level.SolvedSheet
import dev.mmartos.feynmanquest.ui.level.StepPlayer
import dev.mmartos.feynmanquest.ui.level.StepProgress
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk

@Composable
fun PracticeScreen(game: GameState, nav: Navigator, vm: PracticeViewModel = hiltViewModel()) {
  val s by vm.state.collectAsStateWithLifecycle()
  val fb = LocalFeedback.current
  if (!game.mathUnlocked) {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically), horizontalAlignment = Alignment.CenterHorizontally) {
      Text("El modo Dominio se desbloquea al completar el capítulo 1.", color = Cosmic.Text, style = MaterialTheme.typography.bodyLarge)
      AppButton("Ir a la campaña", { nav.map() }, style = ButtonStyle.Primary)
    }
    return
  }
  Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
    if (s.finished) {
      LaunchedEffect(Unit) { fb.sfx(Sfx.Unlock); fb.haptic(Haptic.Confirm) }
      Column(Modifier.widthIn(max = 560.dp).fillMaxSize().statusBarsPadding().navigationBarsPadding().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically), horizontalAlignment = Alignment.CenterHorizontally) {
          MasteryRing(s.percent)
          val pct = s.percent
          Text(if (pct == 100) "¡Dominio total!" else if (pct >= 66) "¡Buen dominio!" else "Sigue practicando", style = MaterialTheme.typography.displaySmall, color = Cosmic.Text, modifier = Modifier.semantics { heading() })
          Text("${s.firstTry} de ${s.steps.size} a la primera", color = Cosmic.Text2, style = MaterialTheme.typography.bodyLarge)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
          AppButton("Inicio", { nav.home() }, Modifier.weight(1f), ButtonStyle.Ghost, large = true)
          AppButton("Otra ronda", vm::again, Modifier.weight(1.6f), ButtonStyle.Primary, large = true)
        }
      }
      return@Box
    }
    Column(Modifier.widthIn(max = 560.dp).fillMaxSize().statusBarsPadding()) {
      Row(Modifier.padding(horizontal = 16.dp, vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
        IconSquare({ nav.home() }, "Salir") { LineIcon(Icons24.Close) }
        StepProgress(s.steps.size, s.idx, s.solved, Modifier.weight(1f))
        Badge("Dominio", Cosmic.Virtual, icon = "∞")
      }
      key(s.step.id) {
        Column(
          Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 16.dp).padding(bottom = 24.dp).navigationBarsPadding(),
          verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
          Text(s.step.prompt, style = MaterialTheme.typography.headlineSmall.copy(fontSize = 23.sp, lineHeight = 29.sp), color = Cosmic.Text, modifier = Modifier.semantics { heading() })
          StepPlayer(s.step, s.solved, onMistake = vm::mistake, onSolved = { vm.solved(); fb.sfx(Sfx.Success); fb.haptic(Haptic.Confirm) })
          if (s.solved) Spacer(Modifier.height(170.dp))
        }
      }
    }
    AnimatedVisibility(s.solved, Modifier.align(Alignment.BottomCenter), enter = slideInVertically(tween(380)) { it } + fadeIn(), exit = slideOutVertically { it } + fadeOut()) {
      SolvedSheet(if (s.missed) "Resuelto" else "¡A la primera!", s.step.solved, "Continuar", vm::next)
    }
  }
}

@Composable
private fun MasteryRing(pct: Int) {
  val p = remember { Animatable(0f) }
  LaunchedEffect(pct) { p.animateTo(pct / 100f, tween(1200)) }
  Box(Modifier.size(150.dp), contentAlignment = Alignment.Center) {
    Canvas(Modifier.fillMaxSize()) {
      val w = 12.dp.toPx()
      drawArc(Cosmic.Surface2, 0f, 360f, false, style = Stroke(w))
      drawArc(Brush.sweepGradient(listOf(Cosmic.Accent, Cosmic.Electron, Cosmic.Accent)), -90f, 360f * p.value, false, style = Stroke(w, cap = StrokeCap.Round))
    }
    Text("$pct%", fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = 36.sp, color = Cosmic.Text)
  }
}
