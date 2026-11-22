package dev.mmartos.feynmanquest.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/** "Cosmic lab" brand tokens — mirrors src/styles/tokens.css. */
object Cosmic {
  val Bg0 = Color(0xFF05071A)
  val Bg1 = Color(0xFF0A0F2C)
  val Bg2 = Color(0xFF111840)
  val Surface = Color(0x0BFFFFFF)
  val Surface2 = Color(0x14FFFFFF)
  val SurfaceStrong = Color(0xFF151D4A)
  val Border = Color(0x24A0B4FF)
  val BorderStrong = Color(0x47A0B4FF)

  val Text = Color(0xFFEEF1FF)
  val Text2 = Color(0xFFAEB6DC)
  val Text3 = Color(0xFF7680AD)

  // Particles (always also differentiated by line shape, never by colour alone).
  val Electron = Color(0xFF38D6FF)
  val Positron = Color(0xFFFF5FB4)
  val Photon = Color(0xFFFFC53D)
  val Virtual = Color(0xFFB69CFF)

  val Accent = Color(0xFF7C5CFF)
  val Accent2 = Color(0xFF38D6FF)
  val Success = Color(0xFF3EE08F)
  val Danger = Color(0xFFFF5D6C)
  val Warning = Color(0xFFFFC53D)

  val GradPrimary = Brush.linearGradient(listOf(Accent, Accent2))
  val GradWarm = Brush.linearGradient(listOf(Positron, Photon))
  val GradSuccess = Brush.linearGradient(listOf(Color(0xFF22C37A), Color(0xFF3EE0C4)))

  val Chapters = listOf(
    Color(0xFF38D6FF), Color(0xFF7C5CFF), Color(0xFFFF5FB4), Color(0xFFFFC53D),
    Color(0xFF3EE08F), Color(0xFFFF8A4C), Color(0xFFF0ABFC),
  )

  /** Resolves "var(--chN)" from the shared content. */
  fun chapter(cssVar: String): Color =
    Regex("""--ch(\d+)""").find(cssVar)?.groupValues?.get(1)?.toIntOrNull()?.let { Chapters.getOrNull(it - 1) } ?: Accent
}
