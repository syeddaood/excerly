package expo.modules.androidalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo native module that schedules exact Android alarms via
 * AlarmManager.setExactAndAllowWhileIdle and cancels them by id.
 *
 * Acceptance (issue #10):
 * - Alarms use AlarmManager.setExactAndAllowWhileIdle
 * - A full-screen intent is used for the ringing UI
 * - A foreground service keeps the alarm ringing
 * - Alarms are rescheduled after reboot (BootReceiver + AlarmStore)
 */
class AndroidAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AndroidAlarm")

    /**
     * Schedule an exact alarm that will fire even in Doze.
     * @param alarmId Stable string id (used as PendingIntent request code seed)
     * @param triggerAtMillis UTC epoch millis when the alarm should fire
     * @param label Optional human-readable label for the ringing UI
     */
    Function("scheduleExactAlarm") { alarmId: String, triggerAtMillis: Double, label: String ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")
      AlarmScheduler.schedule(context, alarmId, triggerAtMillis.toLong(), label)
    }

    /** Cancel a previously scheduled exact alarm. */
    Function("cancelAlarm") { alarmId: String ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")
      AlarmScheduler.cancel(context, alarmId)
    }

    /**
     * Whether the app can schedule exact alarms (API 31+ privilege check).
     * Always true on pre-S devices.
     */
    Function("canScheduleExactAlarms") {
      val context = appContext.reactContext
        ?: return@Function false
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        alarmManager.canScheduleExactAlarms()
      } else {
        true
      }
    }

    /** Stop the ringing foreground service (after mission success). */
    Function("stopRinging") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")
      AlarmRingingService.stop(context)
    }
  }
}

/**
 * Shared helpers for building PendingIntents and talking to AlarmManager.
 * Used by the Expo module and by BootReceiver for reschedule-after-reboot.
 */
object AlarmScheduler {
  private const val ACTION_FIRE = "com.dawnlock.app.ACTION_ALARM_FIRE"

  fun schedule(context: Context, alarmId: String, triggerAtMillis: Long, label: String) {
    // Persist so BootReceiver can restore after reboot.
    AlarmStore.put(context, alarmId, triggerAtMillis, label)

    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pending = buildFirePendingIntent(context, alarmId, label)

    // Core acceptance criterion: exact + allow-while-idle (Doze-safe).
    alarmManager.setExactAndAllowWhileIdle(
      AlarmManager.RTC_WAKEUP,
      triggerAtMillis,
      pending
    )
  }

  fun cancel(context: Context, alarmId: String) {
    AlarmStore.remove(context, alarmId)
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pending = buildFirePendingIntent(context, alarmId, label = "")
    alarmManager.cancel(pending)
    pending.cancel()
  }

  /** Reschedule every persisted future alarm (called from BootReceiver). */
  fun rescheduleAll(context: Context) {
    val now = System.currentTimeMillis()
    for (entry in AlarmStore.all(context)) {
      if (entry.triggerAtMillis > now) {
        schedule(context, entry.alarmId, entry.triggerAtMillis, entry.label)
      } else {
        // Stale past alarm — drop it so we don't immediately fire on boot.
        AlarmStore.remove(context, entry.alarmId)
      }
    }
  }

  fun buildFirePendingIntent(context: Context, alarmId: String, label: String): PendingIntent {
    val intent = Intent(context, AlarmReceiver::class.java).apply {
      action = ACTION_FIRE
      putExtra(EXTRA_ALARM_ID, alarmId)
      putExtra(EXTRA_LABEL, label)
      // Unique data so PendingIntents for different alarms don't collide.
      data = android.net.Uri.parse("dawnlock://alarm/$alarmId")
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    return PendingIntent.getBroadcast(
      context,
      requestCodeFor(alarmId),
      intent,
      flags
    )
  }

  fun requestCodeFor(alarmId: String): Int {
    // Stable positive request code derived from the alarm id.
    return alarmId.hashCode() and 0x7fffffff
  }

  const val EXTRA_ALARM_ID = "alarmId"
  const val EXTRA_LABEL = "label"
  const val ACTION_FIRE_CONST = ACTION_FIRE
}
