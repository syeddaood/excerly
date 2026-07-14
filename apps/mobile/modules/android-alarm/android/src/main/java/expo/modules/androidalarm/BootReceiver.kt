package expo.modules.androidalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Reschedules all persisted exact alarms after the device reboots.
 * Required so AlarmManager entries (which do not survive reboot) are restored.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (
      action != Intent.ACTION_BOOT_COMPLETED &&
      action != Intent.ACTION_LOCKED_BOOT_COMPLETED &&
      action != "android.intent.action.QUICKBOOT_POWERON"
    ) {
      return
    }

    Log.i(TAG, "Boot completed — rescheduling exact alarms")
    AlarmScheduler.rescheduleAll(context)
  }

  companion object {
    private const val TAG = "DawnLockBootReceiver"
  }
}
