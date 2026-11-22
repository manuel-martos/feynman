package dev.mmartos.feynmanquest.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialExpressiveTheme
import androidx.compose.material3.MotionScheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.dp

/**
 * Brand scheme (not dynamic colour): the cosmic palette is the product's
 * identity and the particle colours carry meaning on every diagram.
 */
private val CosmicScheme = darkColorScheme(
  primary = Cosmic.Accent,
  onPrimary = Cosmic.Text,
  primaryContainer = Cosmic.SurfaceStrong,
  onPrimaryContainer = Cosmic.Text,
  secondary = Cosmic.Electron,
  onSecondary = Cosmic.Bg0,
  secondaryContainer = androidx.compose.ui.graphics.Color(0xFF26215C),
  onSecondaryContainer = Cosmic.Text,
  tertiary = Cosmic.Photon,
  onTertiary = Cosmic.Bg0,
  background = Cosmic.Bg0,
  onBackground = Cosmic.Text,
  surface = Cosmic.Bg1,
  onSurface = Cosmic.Text,
  surfaceVariant = Cosmic.Bg2,
  onSurfaceVariant = Cosmic.Text2,
  surfaceContainerLowest = Cosmic.Bg0,
  surfaceContainerLow = Cosmic.Bg1,
  surfaceContainer = androidx.compose.ui.graphics.Color(0xFF0C102C),
  surfaceContainerHigh = Cosmic.Bg2,
  surfaceContainerHighest = Cosmic.SurfaceStrong,
  outline = Cosmic.BorderStrong,
  outlineVariant = Cosmic.Border,
  error = Cosmic.Danger,
  onError = Cosmic.Bg0,
  inverseSurface = Cosmic.Text,
  inverseOnSurface = Cosmic.Bg1,
)

private val AppShapes = Shapes(
  extraSmall = RoundedCornerShape(8.dp),
  small = RoundedCornerShape(10.dp),
  medium = RoundedCornerShape(16.dp),
  large = RoundedCornerShape(24.dp),
  extraLarge = RoundedCornerShape(32.dp),
)

/** Whether continuous animations should run (system setting or in-app toggle). */
val LocalReducedMotion = staticCompositionLocalOf { false }

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun FeynmanQuestTheme(reducedMotion: Boolean = false, content: @Composable () -> Unit) {
  CompositionLocalProvider(LocalReducedMotion provides reducedMotion) {
    MaterialExpressiveTheme(
      colorScheme = CosmicScheme,
      motionScheme = MotionScheme.expressive(),
      typography = AppTypography,
      shapes = AppShapes,
      content = content,
    )
  }
}
