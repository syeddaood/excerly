package expo.modules.androidalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

/**
 * Foreground service (type: mediaPlayback) that owns the ringing session so
 * the OS cannot kill audio/vibration while the user completes the mission.
 *
 * The notification uses a full-screen intent targeting [AlarmRingingActivity]
 * so the ringing UI appears over the lock screen even when the device is idle.
 */
class AlarmRingingService : Service() {
  private var mediaPlayer: MediaPlayer? = null
  private var vibrator: Vibrator? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelfInternal()
      return START_NOT_STICKY
    }

    val alarmId = intent?.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: "unknown"
    val label = intent?.getStringExtra(AlarmScheduler.EXTRA_LABEL) ?: "Alarm"
    val missionKind = intent?.getStringExtra(AlarmScheduler.EXTRA_MISSION_KIND) ?: "math"

    ensureChannel()
    val notification = buildNotification(alarmId, label, missionKind)
    // mediaPlayback FGS type matches the manifest foregroundServiceType.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }

    startRinging()
    return START_STICKY
  }

  override fun onDestroy() {
    stopRingingAudio()
    super.onDestroy()
  }

  private fun stopSelfInternal() {
    stopRingingAudio()
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  private fun startRinging() {
    try {
      val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
      mediaPlayer = MediaPlayer().apply {
        setDataSource(this@AlarmRingingService, uri)
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        )
        isLooping = true
        prepare()
        start()
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to start alarm audio", e)
    }

    try {
      vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        vm.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
      }
      val pattern = longArrayOf(0, 500, 500, 500)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
      } else {
        @Suppress("DEPRECATION")
        vibrator?.vibrate(pattern, 0)
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to start vibration", e)
    }
  }

  private fun stopRingingAudio() {
    try {
      mediaPlayer?.stop()
      mediaPlayer?.release()
    } catch (_: Exception) {
    }
    mediaPlayer = null
    try {
      vibrator?.cancel()
    } catch (_: Exception) {
    }
    vibrator = null
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = NotificationChannel(
      CHANNEL_ID,
      "DawnLock Alarms",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Full-screen alarm ringing notifications"
      setBypassDnd(true)
      enableVibration(true)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(alarmId: String, label: String, missionKind: String): Notification {
    // Full-screen intent → AlarmRingingActivity (showWhenLocked / turnScreenOn),
    // which deep-links into the Expo Router /ring route.
    val fullScreenIntent = Intent(this, AlarmRingingActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
      putExtra(AlarmScheduler.EXTRA_LABEL, label)
      putExtra(AlarmScheduler.EXTRA_MISSION_KIND, missionKind)
    }
    val fullScreenPending = PendingIntent.getActivity(
      this,
      AlarmScheduler.requestCodeFor(alarmId) + 1,
      fullScreenIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val contentPending = PendingIntent.getActivity(
      this,
      AlarmScheduler.requestCodeFor(alarmId) + 2,
      fullScreenIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }

    @Suppress("DEPRECATION")
    return builder
      .setContentTitle("DawnLock Alarm")
      .setContentText(if (label.isNotBlank()) label else "Time to wake up")
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentIntent(contentPending)
      .setFullScreenIntent(fullScreenPending, /* highPriority = */ true)
      .setOngoing(true)
      .setCategory(Notification.CATEGORY_ALARM)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setPriority(Notification.PRIORITY_MAX)
      .build()
  }

  companion object {
    private const val TAG = "DawnLockRingingService"
    private const val CHANNEL_ID = "dawnlock_alarm_ringing"
    private const val NOTIFICATION_ID = 71001
    private const val ACTION_STOP = "com.dawnlock.app.ACTION_STOP_RINGING"

    fun start(
      context: Context,
      alarmId: String,
      label: String,
      missionKind: String = "math"
    ) {
      val intent = Intent(context, AlarmRingingService::class.java).apply {
        putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
        putExtra(AlarmScheduler.EXTRA_LABEL, label)
        putExtra(AlarmScheduler.EXTRA_MISSION_KIND, missionKind)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      val intent = Intent(context, AlarmRingingService::class.java).apply {
        action = ACTION_STOP
      }
      // Prefer an explicit stopService; also send ACTION_STOP for in-process handling.
      try {
        context.startService(intent)
      } catch (_: Exception) {
      }
      context.stopService(Intent(context, AlarmRingingService::class.java))
    }
  }
}
