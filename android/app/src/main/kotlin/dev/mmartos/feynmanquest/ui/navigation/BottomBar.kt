package dev.mmartos.feynmanquest.ui.navigation

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.ViewAgenda
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.Sfx
import dev.mmartos.feynmanquest.ui.theme.Cosmic

/**
 * Docked bottom navigation: four destinations, a pill that springs between
 * them, and a dot on Colección when there are unseen discoveries.
 */
object BottomBar {
  private val BarHeight = 76.dp

  @Composable
  fun contentPadding(): PaddingValues {
    val nav = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
    return PaddingValues(bottom = BarHeight + nav + 16.dp)
  }

  @Composable
  operator fun invoke(active: Tab, badge: Boolean, onSelect: (Tab) -> Unit) {
    val fb = LocalFeedback.current
    val shape = RoundedCornerShape(topStart = 22.dp, topEnd = 22.dp)
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
      Box(
        Modifier
          .widthIn(max = 560.dp)
          .fillMaxWidth()
          .shadow(24.dp, shape, ambientColor = Color.Black, spotColor = Color.Black)
          .clip(shape)
          .background(Brush.verticalGradient(listOf(Color(0xFF111840), Color(0xFF0A0F2C))))
          .border(1.dp, Cosmic.BorderStrong, shape)
          .windowInsetsPadding(WindowInsets.navigationBars)
          .padding(8.dp)
          .height(BarHeight - 16.dp),
      ) {
        BoxWithConstraints(Modifier.fillMaxWidth()) {
          val w = maxWidth / Tab.entries.size
          val x by animateDpAsState(w * active.ordinal, spring(dampingRatio = 0.72f, stiffness = Spring.StiffnessMediumLow), label = "pill")
          Box(
            Modifier
              .offset(x = x)
              .width(w)
              .fillMaxHeight()
              .clip(RoundedCornerShape(16.dp))
              .background(Cosmic.Accent.copy(alpha = 0.24f))
              .border(1.dp, Cosmic.Accent.copy(alpha = 0.35f), RoundedCornerShape(16.dp)),
          )
          Row(Modifier.fillMaxWidth().fillMaxHeight().selectableGroup()) {
            Tab.entries.forEach { t ->
              val on = t == active
              val color by animateColorAsState(if (on) Cosmic.Text else Cosmic.Text2, label = "tab")
              Column(
                Modifier
                  .weight(1f)
                  .fillMaxHeight()
                  .clip(RoundedCornerShape(16.dp))
                  .clickable(remember { MutableInteractionSource() }, indication = null, role = Role.Tab) { fb.sfx(Sfx.Tap); onSelect(t) }
                  .semantics { selected = on },
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
              ) {
                Box {
                  Icon(
                    when (t) { Tab.Home -> Icons.Outlined.Home; Tab.Map -> Icons.Outlined.Map; Tab.Library -> Icons.Outlined.ViewAgenda; Tab.Settings -> Icons.Outlined.Settings },
                    contentDescription = null, tint = color,
                    modifier = Modifier.size(24.dp).then(if (t == Tab.Library) Modifier.rotate(90f) else Modifier),
                  )
                  if (t == Tab.Library && badge) {
                    Box(Modifier.align(Alignment.TopEnd).offset(4.dp, (-3).dp).size(9.dp).clip(CircleShape).background(Cosmic.Positron))
                  }
                }
                Text(stringResource(t.label), color = color, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(top = 2.dp))
              }
            }
          }
        }
      }
    }
  }
}
