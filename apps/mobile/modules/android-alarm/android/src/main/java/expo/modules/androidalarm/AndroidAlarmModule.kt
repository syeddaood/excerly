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
 * AlarmManager.setAlarmClock and cancels them by id.
 */
class AndroidAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AndroidAlarm")

    Function("scheduleExactAlarm") {
      alarmId: String,
      triggerAtMillis: Double,
      label: String,
      repeatDays: List<String>,
      missionKind: String ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")
      AlarmScheduler.schedule(
        context,
        alarmId,
        triggerAtMillis.toLong(),
        label,
        repeatDays,
        missionKind
      )
    }

    Function("cancelAlarm") { alarmId: String ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")
      AlarmScheduler.cancel(context, alarmId)
    }

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

    Function("stopRinging") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")
      AlarmRingingService.stop(context)
    }
  }
}

object AlarmScheduler {
  private const val ACTION_FIRE = "com.dawnlock.app.ACTION_ALARM_FIRE"
  private const val DEEP_LINK_SCHEME = "dawnlock"

  fun schedule(
    context: Context,
    alarmId: String,
    triggerAtMillis: Long,
    label: String,
    repeatDays: List<String> = emptyList(),
    missionKind: String = "math"
  ) {
    AlarmStore.put(context, alarmId, triggerAtMillis, label, repeatDays, missionKind)

    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pending = buildFirePendingIntent(context, alarmId, label, missionKind)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      val showIntent = buildRingDeepLinkIntent(context, alarmId, label, missionKind)
      val showPending = PendingIntent.getActivity(
        context,
        requestCodeFor(alarmId) + 100,
        showIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      val info = AlarmManager.AlarmClockInfo(triggerAtMillis, showPending)
      alarmManager.setAlarmClock(info, pending)
    } else {
      alarmManager.setExactAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP,
        triggerAtMillis,
        pending
      )
    }
  }

  fun cancel(context: Context, alarmId: String) {
    AlarmStore.remove(context, alarmId)
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pending = buildFirePendingIntent(context, alarmId, label = "", missionKind = "math")
    alarmManager.cancel(pending)
    pending.cancel()
  }

  fun rescheduleAll(context: Context) {
    val now = System.currentTimeMillis()
    for (entry in AlarmStore.all(context)) {
      if (entry.triggerAtMillis > now) {
        schedule(
          context,
          entry.alarmId,
          entry.triggerAtMillis,
          entry.label,
          entry.repeatDays,
          entry.missionKind
        )
      } else {
        AlarmStore.remove(context, entry.alarmId)
      }
    }
  }

  fun buildFirePendingIntent(
    context: Context,
    alarmId: String,
    label: String,
    missionKind: String
  ): PendingIntent {
    val intent = Intent(context, AlarmReceiver::class.java).apply {
      action = ACTION_FIRE
      putExtra(EXTRA_ALARM_ID, alarmId)
      putExtra(EXTRA_LABEL, label)
      putExtra(EXTRA_MISSION_KIND, missionKind)
      data = android.net.Uri.parse("$DEEP_LINK_SCHEME://alarm/$alarmId")
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    return PendingIntent.getBroadcast(
      context,
      requestCodeFor(alarmId),
      intent,
      flags
    )
  }

  fun buildRingDeepLinkIntent(
    context: Context,
    alarmId: String,
    label: String,
    missionKind: String
  ): Intent {
    val uri = android.net.Uri.parse("$DEEP_LINK_SCHEME://ring?alarmId=$alarmId")
    return Intent(Intent.ACTION_VIEW, uri).apply {
      setPackage(context.packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      putExtra(EXTRA_ALARM_ID, alarmId)
      putExtra(EXTRA_LABEL, label)
      putExtra(EXTRA_MISSION_KIND, missionKind)
    }
  }

  fun requestCodeFor(alarmId: String): Int {
    return alarmId.hashCode() and 0x7fffffff
  }

  const val EXTRA_ALARM_ID = "alarmId"
  const val EXTRA_LABEL = "label"
  const val EXTRA_MISSION_KIND = "missionKind"
  const val ACTION_FIRE_CONST = ACTION_FIRE
}
