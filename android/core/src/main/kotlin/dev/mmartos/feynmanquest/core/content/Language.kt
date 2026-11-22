package dev.mmartos.feynmanquest.core.content

/** Languages the game ships in. Spanish is the source; the others mirror it. */
enum class Language(val id: String) {
  Es("es"),
  Ca("ca"),
  En("en");

  companion object {
    fun of(id: String): Language = entries.firstOrNull { it.id == id } ?: En
  }
}
