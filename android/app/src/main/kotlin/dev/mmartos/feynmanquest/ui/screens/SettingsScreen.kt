package dev.mmartos.feynmanquest.ui.screens

import android.content.Intent
import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.mmartos.feynmanquest.BuildConfig
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.ui.AppViewModel
import dev.mmartos.feynmanquest.ui.components.AppButton
import dev.mmartos.feynmanquest.ui.components.ButtonStyle
import dev.mmartos.feynmanquest.ui.components.Eyebrow
import dev.mmartos.feynmanquest.ui.components.GlassCard
import dev.mmartos.feynmanquest.ui.theme.Cosmic

@Composable
fun SettingsScreen(content: Content, state: GameState, vm: AppViewModel) {
  var confirm by remember { mutableStateOf(false) }
  val context = LocalContext.current
  val s = state.settings

  Page {
    Text("Ajustes", style = MaterialTheme.typography.displaySmall, color = Cosmic.Text, modifier = Modifier.semantics { heading() })

    GlassCard(Modifier.fillMaxWidth(), padding = 6.dp) {
      Column {
        Toggle("Sonido", "Efectos al conectar líneas y acertar", s.sound) { v -> vm.updateSettings { it.copy(sound = v) } }
        Toggle("Vibración", "Respuesta háptica en el móvil", s.haptics) { v -> vm.updateSettings { it.copy(haptics = v) } }
        Toggle("Reducir movimiento", "Desactiva las animaciones continuas", s.reducedMotion) { v -> vm.updateSettings { it.copy(reducedMotion = v) } }
      }
    }

    GlassCard(Modifier.fillMaxWidth()) {
      Eyebrow("Pruebas con usuarios")
      Text(
        "El juego guarda en este dispositivo métricas anónimas de aprendizaje: errores, pistas, tiempos y capas de explicación consultadas. Nunca salen del dispositivo, salvo que las exportes tú.",
        color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium,
      )
      AppButton("Exportar datos de prueba (JSON)", {
        val send = Intent(Intent.ACTION_SEND).apply {
          type = "application/json"
          putExtra(Intent.EXTRA_SUBJECT, "Feynman Quest — datos de prueba")
          putExtra(Intent.EXTRA_TEXT, vm.exportJson())
        }
        context.startActivity(Intent.createChooser(send, "Exportar datos"))
      }, Modifier.fillMaxWidth())
    }

    GlassCard(Modifier.fillMaxWidth()) {
      Eyebrow("Progreso")
      AnimatedContent(confirm, label = "reset") { asking ->
        if (!asking) {
          AppButton("Reiniciar progreso", { confirm = true }, Modifier.fillMaxWidth(), ButtonStyle.DangerGhost)
        } else {
          Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("¿Seguro? Perderás estrellas, XP y colección.", color = Cosmic.Text, style = MaterialTheme.typography.bodyMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
              AppButton("Cancelar", { confirm = false }, Modifier.weight(1f), ButtonStyle.Ghost)
              AppButton("Sí, reiniciar", { vm.reset(); confirm = false }, Modifier.weight(1f), ButtonStyle.Danger)
            }
          }
        }
      }
    }

    GlassCard(Modifier.fillMaxWidth()) {
      Eyebrow("Acerca de")
      Text(
        "Feynman Quest v${BuildConfig.VERSION_NAME} para Android. ${content.levels.size} niveles de electrodinámica cuántica (QED), del orden árbol a los bucles. Convención: el tiempo avanza de izquierda a derecha.",
        color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium,
      )
      Text(
        "Un diagrama de Feynman representa una contribución a una amplitud de probabilidad, no una fotografía de trayectorias. Las soluciones las comprueba un validador determinista.",
        color = Cosmic.Text2, style = MaterialTheme.typography.bodySmall,
      )
    }
  }
}

@Composable
private fun Toggle(label: String, desc: String, checked: Boolean, onChange: (Boolean) -> Unit) {
  Row(
    Modifier.fillMaxWidth().toggleable(checked, role = Role.Switch, onValueChange = onChange).padding(horizontal = 14.dp, vertical = 12.dp),
    horizontalArrangement = Arrangement.spacedBy(12.dp),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    Column(Modifier.weight(1f)) {
      Text(label, style = MaterialTheme.typography.titleMedium, color = Cosmic.Text)
      Text(desc, style = MaterialTheme.typography.bodySmall, color = Cosmic.Text2)
    }
    Switch(
      checked, onCheckedChange = null,
      colors = SwitchDefaults.colors(checkedTrackColor = Cosmic.Accent, checkedThumbColor = Cosmic.Text, uncheckedTrackColor = Cosmic.Bg2, uncheckedBorderColor = Cosmic.BorderStrong, uncheckedThumbColor = Cosmic.Text3),
    )
  }
}
