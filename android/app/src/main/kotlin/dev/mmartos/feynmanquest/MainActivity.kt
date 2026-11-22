package dev.mmartos.feynmanquest

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import dagger.hilt.android.AndroidEntryPoint
import dev.mmartos.feynmanquest.data.AppLanguage
import dev.mmartos.feynmanquest.ui.FeynmanQuestRoot

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
  override fun attachBaseContext(newBase: Context) = super.attachBaseContext(AppLanguage.wrap(newBase))

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    setContent { FeynmanQuestRoot() }
  }
}
