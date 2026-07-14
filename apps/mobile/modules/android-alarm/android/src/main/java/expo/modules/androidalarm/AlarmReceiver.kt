package expo.modules.androidalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import android.util.Log

/**
 * Receives the exact-alarm PendingIntent from AlarmManager
 * ([AlarmManager.setExactAndAllowWhileIdle]) and starts the ringing
 * foreground service. The service posts a high-priority notification with a
 * full-screen intent so the ringing UI appears even when the device is locked.
 *
 * A short wake lock keeps the CPU awake long enough for the FGS + FSI to start.
 */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent == null) return

    val alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
    val label = intent.getStringExtra(AlarmScheduler.EXTRA_LABEL) ?: ""
    val missionKind = intent.getStringExtra(AlarmScheduler.EXTRA_MISSION_KIND) ?: "math"

    Log.i(TAG, "Alarm fired id=$alarmId label=$label mission=$missionKind")

    // Hold a brief wake lock so the FGS can start even if the device is dozing.
    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    val wakeLock = powerManager.newWakeLock(
      PowerManager.PARTIAL_WAKE_LOCK,
      "dawnlock:alarm_fire"
    )
    wakeLock.acquire(60_000L)

    try {
      // Do NOT remove from AlarmStore — JS reschedules the next occurrence via onAlarmFired.
      AlarmRingingService.start(context, alarmId, label, missionKind)

      // Best-effort direct launch of the ring UI. Full-screen intent on the
      // FGS notification is the reliable path when the device is locked.
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
          Log.w(TAG, "Could not start ringing activity; relying on FSI notification", e2)
        }
      }
    } finally {
      if (wakeLock.isHeld) {
        try {
          wakeLock.release()
        } catch (_: Exception) {
        }
      }
    }
  }

  companion object {
    private const val TAG = "DawnLockAlarmReceiver"
  }
}
