package dev.mmartos.feynmanquest.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import dev.mmartos.feynmanquest.R

private fun variable(res: Int, vararg weights: Int) = weights.map { w ->
  Font(res, FontWeight(w), variationSettings = FontVariation.Settings(FontVariation.weight(w)))
}

/** Space Grotesk: display voice (titles, numbers, labels on the diagrams). */
val SpaceGrotesk = FontFamily(variable(R.font.space_grotesk, 400, 500, 600, 700))

/** Inter: reading voice. */
val Inter = FontFamily(variable(R.font.inter, 400, 500, 600, 700, 800))

private val display = TextStyle(fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, letterSpacing = (-0.01).em)
private val body = TextStyle(fontFamily = Inter)

val AppTypography = Typography(
  displayLarge = display.copy(fontSize = 44.sp, lineHeight = 48.sp),
  displayMedium = display.copy(fontSize = 36.sp, lineHeight = 40.sp),
  displaySmall = display.copy(fontSize = 30.sp, lineHeight = 34.sp),
  headlineLarge = display.copy(fontSize = 28.sp, lineHeight = 32.sp),
  headlineMedium = display.copy(fontSize = 24.sp, lineHeight = 29.sp),
  headlineSmall = display.copy(fontSize = 21.sp, lineHeight = 26.sp),
  titleLarge = display.copy(fontSize = 19.sp, lineHeight = 24.sp),
  titleMedium = display.copy(fontSize = 16.sp, lineHeight = 21.sp),
  titleSmall = display.copy(fontSize = 14.sp, lineHeight = 19.sp),
  bodyLarge = body.copy(fontSize = 16.sp, lineHeight = 24.sp),
  bodyMedium = body.copy(fontSize = 15.sp, lineHeight = 22.sp),
  bodySmall = body.copy(fontSize = 13.sp, lineHeight = 19.sp),
  labelLarge = body.copy(fontSize = 15.sp, lineHeight = 20.sp, fontWeight = FontWeight.SemiBold),
  labelMedium = body.copy(fontSize = 13.sp, lineHeight = 17.sp, fontWeight = FontWeight.SemiBold),
  labelSmall = TextStyle(fontFamily = SpaceGrotesk, fontWeight = FontWeight.Bold, fontSize = 11.sp, lineHeight = 14.sp, letterSpacing = 0.16.em),
)
