package expo.modules.androidalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Receives the exact-alarm PendingIntent from AlarmManager and starts the
 * ringing foreground service + full-screen activity.
 */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent == null) return

    val alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
    val label = intent.getStringExtra(AlarmScheduler.EXTRA_LABEL) ?: ""

    Log.i(TAG, "Exact alarm fired id=$alarmId label=$label")

    // One-shot: drop from the store so reboot does not re-fire immediately.
    AlarmStore.remove(context, alarmId)

    // Start the foreground service that keeps the alarm ringing.
    AlarmRingingService.start(context, alarmId, label)

    // Also launch the full-screen ringing activity over the lock screen.
    // (The service notification also carries a full-screen intent as a backup.)
    val activityIntent = Intent(context, AlarmRingingActivity::class.java).apply {
      addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_NO_USER_ACTION
      )
      putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
      putExtra(AlarmScheduler.EXTRA_LABEL, label)
    }
    try {
      context.startActivity(activityIntent)
    } catch (e: Exception) {
      Log.w(TAG, "Could not start ringing activity directly; relying on FSI", e)
    }
  }

  companion object {
    private const val TAG = "DawnLockAlarmReceiver"
  }
}
