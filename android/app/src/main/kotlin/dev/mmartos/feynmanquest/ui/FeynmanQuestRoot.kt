package dev.mmartos.feynmanquest.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import dev.mmartos.feynmanquest.R
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.content.Language
import dev.mmartos.feynmanquest.core.game.GameState
import dev.mmartos.feynmanquest.ui.components.CosmicBackground
import dev.mmartos.feynmanquest.ui.feedback.LocalFeedback
import dev.mmartos.feynmanquest.ui.feedback.rememberFeedback
import dev.mmartos.feynmanquest.ui.level.LevelScreen
import dev.mmartos.feynmanquest.ui.navigation.BottomBar
import dev.mmartos.feynmanquest.ui.navigation.HomeRoute
import dev.mmartos.feynmanquest.ui.navigation.LevelRoute
import dev.mmartos.feynmanquest.ui.navigation.LibraryRoute
import dev.mmartos.feynmanquest.ui.navigation.MapRoute
import dev.mmartos.feynmanquest.ui.navigation.OnboardingRoute
import dev.mmartos.feynmanquest.ui.navigation.PracticeRoute
import dev.mmartos.feynmanquest.ui.navigation.SettingsRoute
import dev.mmartos.feynmanquest.ui.navigation.Tab
import dev.mmartos.feynmanquest.ui.navigation.tab
import dev.mmartos.feynmanquest.ui.practice.PracticeScreen
import dev.mmartos.feynmanquest.ui.screens.HomeScreen
import dev.mmartos.feynmanquest.ui.screens.LibraryScreen
import dev.mmartos.feynmanquest.ui.screens.MapScreen
import dev.mmartos.feynmanquest.ui.screens.OnboardingScreen
import dev.mmartos.feynmanquest.ui.screens.SettingsScreen
import dev.mmartos.feynmanquest.ui.theme.FeynmanQuestTheme

/** Language of the content on screen; it always matches the resources Android resolved. */
val LocalLanguage = staticCompositionLocalOf { Language.En }

/** Space the docked bottom bar takes, for screens to pad their scrolling content. */
val LocalBottomBarPadding = staticCompositionLocalOf { PaddingValues(0.dp) }

/** Navigation actions shared by every screen. */
class Navigator(private val stack: NavBackStack<NavKey>) {
  fun tab(t: Tab) {
    val key: NavKey = when (t) { Tab.Home -> HomeRoute; Tab.Map -> MapRoute(); Tab.Library -> LibraryRoute; Tab.Settings -> SettingsRoute }
    stack.clear()
    stack.add(HomeRoute)
    if (key != HomeRoute) stack.add(key)
  }
  fun level(id: Int) = stack.add(LevelRoute(id))
  /** Replaces the current level (e.g. "next level") so back returns to the map. */
  fun replaceLevel(id: Int) { stack.removeLastOrNull(); stack.add(LevelRoute(id)) }
  fun map(chapter: Int? = null) { stack.clear(); stack.add(HomeRoute); stack.add(MapRoute(chapter)) }
  fun home() { stack.clear(); stack.add(HomeRoute) }
  fun practice() = stack.add(PracticeRoute)
  fun back() { if (stack.size > 1) stack.removeLastOrNull() }
}

/** Switching tabs cross-fades; drilling into a level slides. */
private val TabFade = NavDisplay.transitionSpec { fadeIn(tween(220)) togetherWith fadeOut(tween(160)) } +
  NavDisplay.popTransitionSpec { fadeIn(tween(220)) togetherWith fadeOut(tween(160)) }

@Composable
fun FeynmanQuestRoot(vm: AppViewModel = hiltViewModel()) {
  val state by vm.state.collectAsStateWithLifecycle()
  val s = state
  val context = LocalContext.current
  // Honour the system "remove animations" setting, like prefers-reduced-motion.
  val systemReduced = androidx.compose.runtime.remember(context) {
    android.provider.Settings.Global.getFloat(context.contentResolver, android.provider.Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
  }
  // values/, values-es/ and values-ca/ each name their content file, so text and content never mix languages.
  val language = Language.of(stringResource(R.string.content_locale))
  val content = androidx.compose.runtime.remember(language) { vm.content(language) }
  FeynmanQuestTheme(reducedMotion = (s?.settings?.reducedMotion == true) || systemReduced) {
    CompositionLocalProvider(LocalLanguage provides language) {
      CosmicBackground {
        // Wait for the first read of the saved progress (a few ms) to avoid flashing onboarding.
        if (s != null) App(vm, s, content)
      }
    }
  }
}

@Composable
private fun App(vm: AppViewModel, state: GameState, content: Content) {
  val feedback = rememberFeedback(state.settings.sound, state.settings.haptics)
  val stack = rememberNavBackStack(if (state.onboarded) HomeRoute else OnboardingRoute)
  val nav = androidx.compose.runtime.remember(stack) { Navigator(stack) }
  val current = stack.lastOrNull()
  val tab = current?.tab

  CompositionLocalProvider(LocalFeedback provides feedback) {
    Box {
      CompositionLocalProvider(LocalBottomBarPadding provides BottomBar.contentPadding()) {
        NavDisplay(
          backStack = stack,
          onBack = { nav.back() },
          entryDecorators = listOf(rememberSaveableStateHolderNavEntryDecorator(), rememberViewModelStoreNavEntryDecorator()),
          transitionSpec = {
            (slideInHorizontally(tween(320)) { it / 6 } + fadeIn(tween(260))) togetherWith fadeOut(tween(160))
          },
          popTransitionSpec = {
            (slideInHorizontally(tween(320)) { -it / 6 } + fadeIn(tween(260))) togetherWith (slideOutHorizontally(tween(280)) { it / 6 } + fadeOut(tween(200)))
          },
          predictivePopTransitionSpec = {
            fadeIn(tween(200)) togetherWith (slideOutHorizontally { it / 4 } + fadeOut())
          },
          entryProvider = entryProvider {
            entry<OnboardingRoute> {
              OnboardingScreen(content, onSkip = { vm.finishOnboarding(); nav.home() }, onDone = { vm.finishOnboarding(); nav.home(); nav.level(1) })
            }
            entry<HomeRoute>(metadata = TabFade) { HomeScreen(content, state, nav) }
            entry<MapRoute>(metadata = TabFade) { key -> MapScreen(content, state, key.chapter, onLevel = nav::level) }
            entry<LibraryRoute>(metadata = TabFade) { LibraryScreen(content, state, onSeen = vm::markConceptsSeen) }
            entry<SettingsRoute>(metadata = TabFade) { SettingsScreen(content, state, vm) }
            entry<LevelRoute> { key -> LevelScreen(key.id, state, nav, onLayer = vm::recordLayer) }
            entry<PracticeRoute> { PracticeScreen(state, nav) }
          },
        )
      }
      AnimatedVisibility(
        visible = tab != null,
        modifier = Modifier.align(Alignment.BottomCenter),
        enter = slideInVertically { it } + fadeIn(),
        exit = slideOutVertically { it } + fadeOut(),
      ) {
        BottomBar(
          active = tab ?: Tab.Home,
          badge = state.unseenConcepts > 0,
          onSelect = { if (it != tab) nav.tab(it) },
        )
      }
    }
  }
}
