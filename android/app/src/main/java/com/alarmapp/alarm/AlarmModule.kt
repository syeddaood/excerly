package com.alarmapp.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class AlarmModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "AlarmModule"
    }

    @ReactMethod
    fun setExactAndAllowWhileIdle(triggerAtMillis: Double, promise: Promise) {
        try {
            val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(reactApplicationContext, AlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                reactApplicationContext,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis.toLong(),
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis.toLong(),
                    pendingIntent
                )
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_ALARM_ERROR", e)
        }
    }
}
