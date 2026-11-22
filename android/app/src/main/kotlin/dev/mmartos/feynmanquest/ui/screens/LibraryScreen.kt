package dev.mmartos.feynmanquest.ui.screens

import androidx.annotation.StringRes
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mmartos.feynmanquest.R
import dev.mmartos.feynmanquest.core.content.Concept
import dev.mmartos.feynmanquest.core.content.ConceptKind
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.ui.components.Chip
import dev.mmartos.feynmanquest.ui.components.bleedHorizontally
import dev.mmartos.feynmanquest.ui.components.Eyebrow
import dev.mmartos.feynmanquest.ui.components.ProgressBar
import dev.mmartos.feynmanquest.ui.diagram.DiagramPlayback
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import dev.mmartos.feynmanquest.ui.theme.SpaceGrotesk

val ConceptKind.color get() = when (this) { ConceptKind.Particle -> Cosmic.Electron; ConceptKind.Rule -> Cosmic.Photon; ConceptKind.Process -> Cosmic.Positron; ConceptKind.Idea -> Cosmic.Virtual }
@get:StringRes val ConceptKind.label get() = when (this) { ConceptKind.Particle -> R.string.kind_particle; ConceptKind.Rule -> R.string.kind_rule; ConceptKind.Process -> R.string.kind_process; ConceptKind.Idea -> R.string.kind_idea }

private val FILTERS: List<Pair<ConceptKind?, Int>> = listOf(
  null to R.string.library_all, ConceptKind.Particle to R.string.library_particles, ConceptKind.Rule to R.string.library_rules,
  ConceptKind.Process to R.string.library_processes, ConceptKind.Idea to R.string.library_ideas,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(content: Content, state: GameState, onSeen: () -> Unit) {
  var filter by remember { mutableStateOf<ConceptKind?>(null) }
  var open by remember { mutableStateOf<Concept?>(null) }
  // Concepts that are new on arrival keep their "Nuevo" tag for this visit.
  val fresh = remember { state.concepts.filter { it !in state.seenConcepts }.toSet() }
  LaunchedEffect(Unit) { onSeen() }
  val fb = LocalFeedback.current
  val list = content.concepts.filter { filter == null || it.kind == filter }

  Page(gap = 14.dp) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
      Text(stringResource(R.string.library_title), style = MaterialTheme.typography.displaySmall, color = Cosmic.Text, modifier = Modifier.semantics { heading() })
      Text(stringResource(R.string.library_count, state.concepts.size, content.concepts.size), color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium)
      ProgressBar(state.concepts.size / content.concepts.size.toFloat(), Modifier.fillMaxWidth().padding(top = 4.dp))
    }
    // Scroll edge to edge, so chips aren't cut off at the page gutter, while still starting aligned with it.
    Row(Modifier.bleedHorizontally(16.dp).horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
      FILTERS.forEach { (k, label) -> Chip(stringResource(label), filter == k) { filter = k } }
    }
    list.chunked(2).forEach { row ->
      Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        row.forEach { c ->
          val has = c.id in state.concepts
          val kc = c.kind.color
          val shape = RoundedCornerShape(18.dp)
          Column(
            Modifier
              .weight(1f)
              .heightIn(min = 140.dp)
              .clip(shape)
              .background(if (has) Brush.verticalGradient(listOf(kc.copy(alpha = 0.14f), kc.copy(alpha = 0.03f))) else Brush.verticalGradient(listOf(Cosmic.Surface, Cosmic.Surface)))
              .border(1.dp, if (has) kc.copy(alpha = 0.45f) else Cosmic.Border, shape)
              .clickable(enabled = has, role = Role.Button) { fb.sfx(Sfx.Tap); open = c }
              .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
          ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
              Text(if (has) c.symbol ?: "✦" else "?", fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = 22.sp, color = if (has) kc else Cosmic.Text3, modifier = Modifier.weight(1f))
              if (c.id in fresh) Text(stringResource(R.string.library_new), Modifier.clip(CircleShape).background(Cosmic.Positron).padding(horizontal = 8.dp, vertical = 2.dp), color = Cosmic.Bg0, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
            }
            Text(if (has) c.title else "???", style = MaterialTheme.typography.titleMedium, color = Cosmic.Text)
            Text(if (has) c.summary else stringResource(R.string.library_locked), color = Cosmic.Text2, style = MaterialTheme.typography.bodySmall)
          }
        }
        if (row.size == 1) Box(Modifier.weight(1f))
      }
    }
  }

  open?.let { c ->
    ModalBottomSheet(
      onDismissRequest = { open = null },
      sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
      containerColor = Cosmic.Bg2,
      contentColor = Cosmic.Text,
    ) {
      Column(
        Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(bottom = 24.dp).navigationBarsPadding(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
      ) {
        Eyebrow(stringResource(c.kind.label), color = c.kind.color)
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
          c.symbol?.let { Text(it, fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = 28.sp, color = c.kind.color) }
          Text(c.title, style = MaterialTheme.typography.headlineMedium, color = Cosmic.Text, modifier = Modifier.semantics { heading() })
        }
        c.diagram?.let {
          Box(Modifier.clip(RoundedCornerShape(20.dp)).background(Color.Black.copy(alpha = 0.2f)).border(1.dp, Cosmic.Border, RoundedCornerShape(20.dp)).padding(12.dp)) {
            DiagramPlayback(it)
          }
        }
        Text(c.summary, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Medium), color = Cosmic.Text)
        Text(c.body, style = MaterialTheme.typography.bodyLarge, color = Cosmic.Text2)
      }
    }
  }
}
