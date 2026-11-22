package dev.mmartos.feynmanquest.data

import android.app.Activity
import android.app.LocaleManager
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.os.LocaleList
import androidx.core.content.edit
import java.util.Locale

/**
 * The interface language the user picked, or null to follow the device.
 *
 * Android 13+ keeps it as the system per-app language (also editable from the system settings).
 * Older versions store it here and apply it when the activity attaches its context.
 * Either way the activity is recreated, and the UI and content reload in the new language.
 */
object AppLanguage {
  /** Languages offered in Settings; null is "Automatic". */
  val choices: List<String?> = listOf(null, "es", "ca", "en")

  private const val PREFS = "app_language"
  private const val KEY = "tag"
  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun current(context: Context): String? =
    if (Build.VERSION.SDK_INT >= 33) {
      context.getSystemService(LocaleManager::class.java).applicationLocales.takeUnless { it.isEmpty }?.get(0)?.language
    } else {
      prefs(context).getString(KEY, null)
    }

  fun set(activity: Activity, tag: String?) {
    if (Build.VERSION.SDK_INT >= 33) {
      // The system recreates the activity with the new configuration.
      activity.getSystemService(LocaleManager::class.java).applicationLocales =
        if (tag == null) LocaleList.getEmptyLocaleList() else LocaleList.forLanguageTags(tag)
    } else {
      prefs(activity).edit { if (tag == null) remove(KEY) else putString(KEY, tag) }
      activity.recreate()
    }
  }

  /** Before Android 13: the activity's context, localised to the stored choice. */
  fun wrap(base: Context): Context {
    if (Build.VERSION.SDK_INT >= 33) return base
    val tag = prefs(base).getString(KEY, null) ?: return base
    val config = Configuration(base.resources.configuration).apply { setLocales(LocaleList(Locale.forLanguageTag(tag))) }
    return base.createConfigurationContext(config)
  }

  /** A language's name, written in that language. */
  fun nativeName(tag: String): String = Locale.forLanguageTag(tag).let { it.getDisplayLanguage(it) }.replaceFirstChar { it.uppercaseChar() }
}
