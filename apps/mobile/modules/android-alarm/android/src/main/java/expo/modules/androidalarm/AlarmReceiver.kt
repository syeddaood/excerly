package expo.modules.androidalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Receives the exact-alarm PendingIntent from AlarmManager and starts the
 * ringing foreground service + deep-links into the RN ring screen.
 */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent == null) return

    val alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
    val label = intent.getStringExtra(AlarmScheduler.EXTRA_LABEL) ?: ""
    val missionKind = intent.getStringExtra(AlarmScheduler.EXTRA_MISSION_KIND) ?: "math"

    Log.i(TAG, "Alarm fired id=$alarmId label=$label")

    // Do NOT remove from AlarmStore — JS reschedules the next occurrence via onAlarmFired.

    AlarmRingingService.start(context, alarmId, label)

    val deepLink = AlarmScheduler.buildRingDeepLinkIntent(context, alarmId, label, missionKind)
    try {
      context.startActivity(deepLink)
    } catch (e: Exception) {
      Log.w(TAG, "Deep link failed; falling back to AlarmRingingActivity", e)
      val fallback = Intent(context, AlarmRingingActivity::class.java).apply {
        addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_NO_USER_ACTION
        )
        putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
        putExtra(AlarmScheduler.EXTRA_LABEL, label)
        putExtra(AlarmScheduler.EXTRA_MISSION_KIND, missionKind)
      }
      try {
        context.startActivity(fallback)
      } catch (e2: Exception) {
        Log.w(TAG, "Could not start ringing activity; relying on FSI", e2)
      }
    }
  }

  companion object {
    private const val TAG = "DawnLockAlarmReceiver"
  }
}
