package dev.mmartos.feynmanquest

import android.app.Application
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.mmartos.feynmanquest.ui.theme.Cosmic
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import com.github.takahirom.roborazzi.captureRoboImage
import dev.mmartos.feynmanquest.core.content.ChoiceStep
import dev.mmartos.feynmanquest.ui.level.StepPlayer
import dev.mmartos.feynmanquest.ui.theme.FeynmanQuestTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], application = Application::class, qualifiers = "w411dp-h891dp-xxhdpi")
class StepPlayerTest {
  @get:Rule val compose = createComposeRule()

  private val level1 = TestContent.content.level(1)!!
  private val choice = level1.steps.first { it is ChoiceStep } as ChoiceStep

  @Test fun choiceGivesFeedbackThenSolves() {
    var mistakes = 0
    var solved = 0
    compose.setContent {
      FeynmanQuestTheme(reducedMotion = true) {
        Column { StepPlayer(choice, solved = false, onMistake = { mistakes++ }, onSolved = { solved++ }) }
      }
    }
    val wrong = choice.options.first { !it.correct }
    compose.onNodeWithText(wrong.text).performClick()
    compose.onNodeWithText(wrong.feedback!!).assertIsDisplayed()
    assertEquals(1, mistakes)

    compose.onNodeWithText(choice.options.first { it.correct }.text).performClick()
    assertEquals(1, solved)
  }

  @Test fun tapStepScreenshot() {
    compose.setContent {
      FeynmanQuestTheme(reducedMotion = true) {
        Column(Modifier.background(Cosmic.Bg0).padding(16.dp)) { StepPlayer(level1.steps.first(), solved = false, onMistake = {}, onSolved = {}) }
      }
    }
    compose.onRoot().captureRoboImage("src/test/screenshots/level1-tap.png")
  }
}
