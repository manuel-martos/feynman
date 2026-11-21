package dev.mmartos.feynmanquest

import dev.mmartos.feynmanquest.core.content.Content
import java.io.File

/** The shared content bundle, read straight from the monorepo. */
object TestContent {
  val content: Content by lazy {
    val f = listOf("../shared/content/es.json", "../../shared/content/es.json").map(::File).first { it.exists() }
    Content.parse(f.readText())
  }
}
