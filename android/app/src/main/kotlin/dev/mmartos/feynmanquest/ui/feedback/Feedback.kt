package dev.mmartos.feynmanquest.ui.feedback

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalView
import java.util.concurrent.Executors
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.sin

/** Sound effects, synthesised on the fly like the web version (no audio assets). */
enum class Sfx { Tap, Select, Snap, Connect, Remove, Deny, Error, Success, Star, Unlock }

/** Haptic moments, mapped to the platform's semantic constants. */
enum class Haptic { Tick, Connect, Confirm, Reject }

private enum class Wave { Sine, Triangle, Square, Saw }

private data class Tone(val freq: Double, val start: Double, val dur: Double, val wave: Wave, val gain: Double, val slideTo: Double? = null)

object SoundKit {
  private const val RATE = 44_100
  private val executor = Executors.newSingleThreadExecutor()
  private val cache = HashMap<Sfx, ShortArray>()

  private fun tones(s: Sfx): List<Tone> = when (s) {
    Sfx.Tap -> listOf(Tone(660.0, 0.0, 0.06, Wave.Triangle, 0.05))
    Sfx.Select -> listOf(Tone(520.0, 0.0, 0.08, Wave.Triangle, 0.06, 780.0))
    Sfx.Snap -> listOf(Tone(1200.0, 0.0, 0.04, Wave.Sine, 0.035))
    Sfx.Connect -> listOf(Tone(440.0, 0.0, 0.09, Wave.Triangle, 0.07, 880.0), Tone(1320.0, 0.05, 0.08, Wave.Sine, 0.03))
    Sfx.Remove -> listOf(Tone(500.0, 0.0, 0.1, Wave.Triangle, 0.05, 250.0))
    Sfx.Deny -> listOf(Tone(220.0, 0.0, 0.12, Wave.Square, 0.025, 180.0))
    Sfx.Error -> listOf(Tone(300.0, 0.0, 0.16, Wave.Saw, 0.03, 200.0), Tone(240.0, 0.12, 0.2, Wave.Saw, 0.025, 150.0))
    Sfx.Success -> listOf(523.25, 659.25, 783.99, 1046.5).mapIndexed { i, f -> Tone(f, i * 0.08, 0.35, Wave.Triangle, 0.07) }
    Sfx.Star -> listOf(Tone(1046.5, 0.0, 0.18, Wave.Sine, 0.06, 1568.0))
    Sfx.Unlock -> listOf(392.0, 523.25, 659.25, 783.99, 1046.5).mapIndexed { i, f -> Tone(f, i * 0.07, 0.4, Wave.Sine, 0.06) }
  }

  private fun render(s: Sfx): ShortArray {
    val ts = tones(s)
    val total = ts.maxOf { it.start + it.dur + 0.02 }
    val buf = DoubleArray((total * RATE).toInt())
    for (t in ts) {
      val n0 = (t.start * RATE).toInt()
      val n = (t.dur * RATE).toInt()
      var phase = 0.0
      for (i in 0 until n) {
        val x = i.toDouble() / n
        val f = if (t.slideTo != null) t.freq * exp(ln(t.slideTo / t.freq) * x) else t.freq
        phase += f / RATE
        val p = phase % 1.0
        val v = when (t.wave) {
          Wave.Sine -> sin(2 * PI * p)
          Wave.Triangle -> 4 * kotlin.math.abs(p - 0.5) - 1
          Wave.Square -> if (p < 0.5) 1.0 else -1.0
          Wave.Saw -> 2 * p - 1
        }
        val secs = i.toDouble() / RATE
        // Linear attack (12 ms), exponential decay to silence — as in WebAudio.
        val env = if (secs < 0.012) secs / 0.012 else exp(ln(0.0001 / 1.0) * (secs - 0.012) / (t.dur - 0.012))
        val k = n0 + i
        if (k < buf.size) buf[k] += v * t.gain * env * 3.0
      }
    }
    return ShortArray(buf.size) { (buf[it].coerceIn(-1.0, 1.0) * Short.MAX_VALUE).toInt().toShort() }
  }

  fun play(s: Sfx) = executor.execute {
    runCatching {
      val pcm = synchronized(cache) { cache.getOrPut(s) { render(s) } }
      val track = AudioTrack.Builder()
        .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
        .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(RATE).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
        .setTransferMode(AudioTrack.MODE_STATIC)
        .setBufferSizeInBytes(pcm.size * 2)
        .build()
      track.write(pcm, 0, pcm.size)
      track.setNotificationMarkerPosition(pcm.size - 1)
      track.setPlaybackPositionUpdateListener(object : AudioTrack.OnPlaybackPositionUpdateListener {
        override fun onMarkerReached(t: AudioTrack) = t.release()
        override fun onPeriodicNotification(t: AudioTrack) = Unit
      }, null)
      track.play()
    }
  }
}

/** Sound and haptics, honouring the player's settings. */
class Feedback(private val view: View?, private val sound: Boolean, private val haptics: Boolean) {
  fun sfx(s: Sfx) { if (sound) SoundKit.play(s) }

  fun haptic(h: Haptic) {
    if (!haptics || view == null) return
    val c = when (h) {
      Haptic.Tick -> HapticFeedbackConstants.CLOCK_TICK
      Haptic.Connect -> HapticFeedbackConstants.VIRTUAL_KEY
      Haptic.Confirm -> if (android.os.Build.VERSION.SDK_INT >= 30) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.VIRTUAL_KEY
      Haptic.Reject -> if (android.os.Build.VERSION.SDK_INT >= 30) HapticFeedbackConstants.REJECT else HapticFeedbackConstants.LONG_PRESS
    }
    view.performHapticFeedback(c)
  }

  companion object { val None = Feedback(null, sound = false, haptics = false) }
}

val LocalFeedback = staticCompositionLocalOf { Feedback.None }

@Composable
fun rememberFeedback(sound: Boolean, haptics: Boolean): Feedback {
  val view = LocalView.current
  return remember(view, sound, haptics) { Feedback(view, sound, haptics) }
}
