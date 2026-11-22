package dev.mmartos.feynmanquest.data

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import dev.mmartos.feynmanquest.core.content.Content
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Campaign content, read once from the bundled shared/content/es.json (the same
 * file the web app is exported from). Parsing takes a few milliseconds.
 */
@Singleton
class ContentRepository @Inject constructor(@ApplicationContext context: Context) {
  val content: Content by lazy {
    context.assets.open("es.json").bufferedReader().use { Content.parse(it.readText()) }
  }
}
