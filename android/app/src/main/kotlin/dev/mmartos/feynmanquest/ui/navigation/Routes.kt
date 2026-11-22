package dev.mmartos.feynmanquest.ui.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable data object OnboardingRoute : NavKey
@Serializable data object HomeRoute : NavKey
@Serializable data class MapRoute(val chapter: Int? = null) : NavKey
@Serializable data object LibraryRoute : NavKey
@Serializable data object SettingsRoute : NavKey
@Serializable data class LevelRoute(val id: Int) : NavKey
@Serializable data object PracticeRoute : NavKey

enum class Tab(val label: String) { Home("Inicio"), Map("Campaña"), Library("Colección"), Settings("Ajustes") }

val NavKey.tab: Tab?
  get() = when (this) {
    HomeRoute -> Tab.Home
    is MapRoute -> Tab.Map
    LibraryRoute -> Tab.Library
    SettingsRoute -> Tab.Settings
    else -> null
  }
