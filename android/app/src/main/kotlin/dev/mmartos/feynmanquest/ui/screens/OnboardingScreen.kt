package dev.mmartos.feynmanquest.ui.screens

import androidx.annotation.StringRes
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mmartos.feynmanquest.R
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.ui.components.AppButton
import dev.mmartos.feynmanquest.ui.components.ButtonStyle
import dev.mmartos.feynmanquest.ui.diagram.DiagramCanvas
import dev.mmartos.feynmanquest.ui.diagram.wavyPath
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk

private data class Slide(@StringRes val title: Int, @StringRes val body: Int)

private val SLIDES = listOf(
  Slide(R.string.onb_title_1, R.string.onb_body_1),
  Slide(R.string.onb_title_2, R.string.onb_body_2),
  Slide(R.string.onb_title_3, R.string.onb_body_3),
)

@Composable
fun OnboardingScreen(content: Content, onSkip: () -> Unit, onDone: () -> Unit) {
  var i by rememberSaveable { mutableIntStateOf(0) }
  val last = i == SLIDES.lastIndex
  Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
    Column(Modifier.widthIn(max = 560.dp).fillMaxSize().statusBarsPadding().navigationBarsPadding().padding(16.dp)) {
      Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Logo(36.dp)
        Spacer(Modifier.weight(1f))
        Text(stringResource(R.string.onb_skip), color = Cosmic.Accent2, style = MaterialTheme.typography.labelLarge, modifier = Modifier.clip(RoundedCornerShape(8.dp)).clickable(onClick = onSkip).padding(8.dp))
      }
      AnimatedContent(
        i, Modifier.weight(1f),
        transitionSpec = { (slideInHorizontally(tween(380)) { it / 5 } + fadeIn(tween(380))) togetherWith fadeOut(tween(150)) },
        label = "slide",
      ) { k ->
        Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center) {
          when (k) {
            0 -> DiagramCanvas(content.art.onboarding, Modifier.fillMaxWidth().padding(bottom = 24.dp), showLabels = false)
            1 -> Column(Modifier.padding(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
              Legend(Cosmic.Electron, stringResource(R.string.onb_electron), stringResource(R.string.onb_electron_desc), Legend.Forward)
              Legend(Cosmic.Positron, stringResource(R.string.onb_positron), stringResource(R.string.onb_positron_desc), Legend.Backward)
              Legend(Cosmic.Photon, stringResource(R.string.onb_photon), stringResource(R.string.onb_photon_desc), Legend.Wave)
            }
            else -> Column(Modifier.padding(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
              listOf(R.string.onb_observe, R.string.onb_experiment, R.string.onb_understand, R.string.onb_progress).map { stringResource(it) }.forEachIndexed { n, w ->
                Row(
                  Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Cosmic.Surface).border(1.dp, Cosmic.Border, RoundedCornerShape(16.dp)).padding(12.dp),
                  verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                  Box(Modifier.size(32.dp).clip(RoundedCornerShape(10.dp)).background(Cosmic.GradPrimary), contentAlignment = Alignment.Center) {
                    Text("${n + 1}", fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, color = Color.White)
                  }
                  Text(w, style = MaterialTheme.typography.titleMedium, color = Cosmic.Text)
                }
              }
            }
          }
          Text(stringResource(SLIDES[k].title), style = MaterialTheme.typography.displaySmall, color = Cosmic.Text, modifier = Modifier.semantics { heading() })
          Text(stringResource(SLIDES[k].body), style = MaterialTheme.typography.bodyLarge, color = Cosmic.Text2, modifier = Modifier.padding(top = 10.dp))
        }
      }
      Row(Modifier.fillMaxWidth().padding(vertical = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)) {
        SLIDES.indices.forEach { k ->
          val w by animateDpAsState(if (k == i) 24.dp else 8.dp, label = "dot")
          Box(Modifier.width(w).height(8.dp).clip(CircleShape).background(if (k == i) Cosmic.Accent2 else Cosmic.Surface2))
        }
      }
      AppButton(
        stringResource(if (last) R.string.onb_start_level_1 else R.string.onb_next),
        { if (last) onDone() else i++ },
        Modifier.fillMaxWidth(), ButtonStyle.Primary, large = true, sound = if (last) Sfx.Unlock else Sfx.Tap,
      )
    }
  }
}

private enum class Legend { Forward, Backward, Wave }

@Composable
private fun Legend(color: Color, label: String, desc: String, kind: Legend) {
  Row(
    Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Cosmic.Surface).border(1.dp, Cosmic.Border, RoundedCornerShape(16.dp)).padding(14.dp),
    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp),
  ) {
    Canvas(Modifier.width(60.dp).height(16.dp)) {
      val k = size.width / 60f
      scale(k, k, pivot = Offset.Zero) {
        if (kind == Legend.Wave) drawPath(wavyPath(Offset(4f, 8f), Offset(56f, 8f), 0f, 4f, 7f), color, style = Stroke(2.4f, cap = StrokeCap.Round))
        else {
          drawLine(color, Offset(4f, 8f), Offset(56f, 8f), 2.4f, StrokeCap.Round)
          val p = if (kind == Legend.Forward) Path().apply { moveTo(36f, 8f); lineTo(26f, 3f); lineTo(26f, 13f); close() }
          else Path().apply { moveTo(24f, 8f); lineTo(34f, 3f); lineTo(34f, 13f); close() }
          drawPath(p, color)
        }
      }
    }
    Column {
      Text(label, style = MaterialTheme.typography.titleMedium, color = color)
      Text(desc, style = MaterialTheme.typography.bodySmall, color = Cosmic.Text2, fontSize = 14.sp)
    }
  }
}
