package expo.modules.androidalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Reschedules all persisted exact alarms after BOOT_COMPLETED (and related
 * package-replace events). AlarmStore is SharedPreferences-backed so this
 * path does not depend on the JS runtime being alive.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (
      action != Intent.ACTION_BOOT_COMPLETED &&
      action != Intent.ACTION_LOCKED_BOOT_COMPLETED &&
      action != Intent.ACTION_MY_PACKAGE_REPLACED &&
      action != "android.intent.action.QUICKBOOT_POWERON" &&
      action != "com.htc.intent.action.QUICKBOOT_POWERON"
    ) {
      return
    }

    Log.i(TAG, "Rescheduling exact alarms after $action")
    try {
      AlarmScheduler.rescheduleAll(context.applicationContext)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to reschedule alarms after boot", e)
    }
  }

  companion object {
    private const val TAG = "DawnLockBootReceiver"
  }
}
