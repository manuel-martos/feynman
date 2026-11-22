package dev.mmartos.feynmanquest.ui.screens

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.mmartos.feynmanquest.BuildConfig
import dev.mmartos.feynmanquest.R
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.data.AppLanguage
import dev.mmartos.feynmanquest.ui.AppViewModel
import dev.mmartos.feynmanquest.ui.components.AppButton
import dev.mmartos.feynmanquest.ui.components.ButtonStyle
import dev.mmartos.feynmanquest.ui.components.Chip
import dev.mmartos.feynmanquest.ui.components.Eyebrow
import dev.mmartos.feynmanquest.ui.components.GlassCard
import dev.mmartos.feynmanquest.ui.theme.Cosmic

@Composable
fun SettingsScreen(content: Content, state: GameState, vm: AppViewModel) {
  var confirm by remember { mutableStateOf(false) }
  val context = LocalContext.current
  val s = state.settings
  val exportSubject = stringResource(R.string.settings_export_subject)
  val exportChooser = stringResource(R.string.settings_export_chooser)

  Page {
    Text(stringResource(R.string.settings_title), style = MaterialTheme.typography.displaySmall, color = Cosmic.Text, modifier = Modifier.semantics { heading() })

    GlassCard(Modifier.fillMaxWidth(), padding = 6.dp) {
      Column {
        Toggle(stringResource(R.string.settings_sound), stringResource(R.string.settings_sound_desc), s.sound) { v -> vm.updateSettings { it.copy(sound = v) } }
        Toggle(stringResource(R.string.settings_haptics), stringResource(R.string.settings_haptics_desc), s.haptics) { v -> vm.updateSettings { it.copy(haptics = v) } }
        Toggle(stringResource(R.string.settings_motion), stringResource(R.string.settings_motion_desc), s.reducedMotion) { v -> vm.updateSettings { it.copy(reducedMotion = v) } }
      }
    }

    GlassCard(Modifier.fillMaxWidth()) {
      Eyebrow(stringResource(R.string.settings_language))
      val chosen = remember { AppLanguage.current(context) }
      FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        AppLanguage.choices.forEach { tag ->
          Chip(tag?.let(AppLanguage::nativeName) ?: stringResource(R.string.settings_language_auto), chosen == tag) {
            if (tag != chosen) context.findActivity()?.let { AppLanguage.set(it, tag) }
          }
        }
      }
    }

    GlassCard(Modifier.fillMaxWidth()) {
      Eyebrow(stringResource(R.string.settings_testing))
      Text(
        stringResource(R.string.settings_testing_body),
        color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium,
      )
      AppButton(stringResource(R.string.settings_export), {
        val send = Intent(Intent.ACTION_SEND).apply {
          type = "application/json"
          putExtra(Intent.EXTRA_SUBJECT, exportSubject)
          putExtra(Intent.EXTRA_TEXT, vm.exportJson())
        }
        context.startActivity(Intent.createChooser(send, exportChooser))
      }, Modifier.fillMaxWidth())
    }

    GlassCard(Modifier.fillMaxWidth()) {
      Eyebrow(stringResource(R.string.settings_progress))
      AnimatedContent(confirm, label = "reset") { asking ->
        if (!asking) {
          AppButton(stringResource(R.string.settings_reset), { confirm = true }, Modifier.fillMaxWidth(), ButtonStyle.DangerGhost)
        } else {
          Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(stringResource(R.string.settings_confirm), color = Cosmic.Text, style = MaterialTheme.typography.bodyMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
              AppButton(stringResource(R.string.settings_cancel), { confirm = false }, Modifier.weight(1f), ButtonStyle.Ghost)
              AppButton(stringResource(R.string.settings_confirm_reset), { vm.reset(); confirm = false }, Modifier.weight(1f), ButtonStyle.Danger)
            }
          }
        }
      }
    }

    GlassCard(Modifier.fillMaxWidth()) {
      Eyebrow(stringResource(R.string.settings_about))
      Text(
        stringResource(R.string.settings_about_body, BuildConfig.VERSION_NAME, content.levels.size),
        color = Cosmic.Text2, style = MaterialTheme.typography.bodyMedium,
      )
      Text(
        stringResource(R.string.settings_about_note),
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

private tailrec fun Context.findActivity(): Activity? = when (this) {
  is Activity -> this
  is ContextWrapper -> baseContext.findActivity()
  else -> null
}
