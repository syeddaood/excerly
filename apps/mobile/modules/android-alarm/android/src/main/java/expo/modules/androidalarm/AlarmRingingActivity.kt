package expo.modules.androidalarm

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Full-screen ringing shell shown over the lock screen via the FGS
 * notification's full-screen intent.
 *
 * Declared with showWhenLocked + turnScreenOn in the module AndroidManifest.
 * Immediately deep-links into the Expo Router `/ring` route
 * (`dawnlock://ring?alarmId=...`); shows a minimal fallback UI if that fails.
 */
class AlarmRingingActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
      val keyguard = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
      keyguard.requestDismissKeyguard(this, null)
    }
    @Suppress("DEPRECATION")
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
    )

    val alarmId = intent?.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: ""
    val label = intent?.getStringExtra(AlarmScheduler.EXTRA_LABEL) ?: "Alarm"
    val missionKind = intent?.getStringExtra(AlarmScheduler.EXTRA_MISSION_KIND) ?: "math"

    val deepLink = AlarmScheduler.buildRingDeepLinkIntent(this, alarmId, label, missionKind)
    try {
      startActivity(deepLink)
      finish()
      return
    } catch (_: Exception) {
      // Fall through to placeholder UI.
    }

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(48, 96, 48, 48)
      setBackgroundColor(0xFF111111.toInt())
    }

    val title = TextView(this).apply {
      text = "DawnLock"
      textSize = 28f
      setTextColor(0xFFFFFFFF.toInt())
    }
    val subtitle = TextView(this).apply {
      text = if (label.isNotBlank()) label else "Alarm is ringing"
      textSize = 22f
      setTextColor(0xFFFFCC00.toInt())
    }
    val body = TextView(this).apply {
      text = "Open DawnLock and complete your $missionKind mission.\n(id: $alarmId)"
      textSize = 16f
      setTextColor(0xFFCCCCCC.toInt())
    }

    root.addView(title)
    root.addView(subtitle)
    root.addView(body)
    setContentView(root)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
  }
}
