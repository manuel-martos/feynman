package dev.mmartos.feynmanquest.data

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import dev.mmartos.feynmanquest.core.content.Content
import dev.mmartos.feynmanquest.core.content.Language
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Campaign content, read from the bundled shared/content/{es,ca,en}.json (the same files
 * the web app is exported from). Each language is parsed once, in a few milliseconds.
 */
@Singleton
class ContentRepository @Inject constructor(@ApplicationContext private val context: Context) {
  private val cache = ConcurrentHashMap<Language, Content>()

  fun content(language: Language): Content = cache.getOrPut(language) {
    context.assets.open("${language.id}.json").bufferedReader().use { Content.parse(it.readText()) }
  }
}
