package expo.modules.androidalarm

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Lightweight SharedPreferences-backed store of scheduled alarms.
 * Used so BootReceiver can reschedule after reboot without depending on JS.
 */
object AlarmStore {
  private const val PREFS = "dawnlock_exact_alarms"
  private const val KEY_ALARMS = "alarms"

  data class Entry(
    val alarmId: String,
    val triggerAtMillis: Long,
    val label: String,
    val repeatDays: List<String> = emptyList(),
    val missionKind: String = "math"
  )

  fun put(
    context: Context,
    alarmId: String,
    triggerAtMillis: Long,
    label: String,
    repeatDays: List<String> = emptyList(),
    missionKind: String = "math"
  ) {
    val list = all(context).toMutableList()
    list.removeAll { it.alarmId == alarmId }
    list.add(Entry(alarmId, triggerAtMillis, label, repeatDays, missionKind))
    write(context, list)
  }

  fun remove(context: Context, alarmId: String) {
    val list = all(context).filterNot { it.alarmId == alarmId }
    write(context, list)
  }

  fun all(context: Context): List<Entry> {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_ALARMS, "[]") ?: "[]"
    return try {
      val arr = JSONArray(raw)
      buildList {
        for (i in 0 until arr.length()) {
          val obj = arr.getJSONObject(i)
          val daysArr = obj.optJSONArray("repeatDays")
          val days = buildList {
            if (daysArr != null) {
              for (j in 0 until daysArr.length()) {
                add(daysArr.getString(j))
              }
            }
          }
          add(
            Entry(
              alarmId = obj.getString("alarmId"),
              triggerAtMillis = obj.getLong("triggerAtMillis"),
              label = obj.optString("label", ""),
              repeatDays = days,
              missionKind = obj.optString("missionKind", "math")
            )
          )
        }
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun write(context: Context, entries: List<Entry>) {
    val arr = JSONArray()
    for (e in entries) {
      val days = JSONArray()
      for (d in e.repeatDays) {
        days.put(d)
      }
      arr.put(
        JSONObject()
          .put("alarmId", e.alarmId)
          .put("triggerAtMillis", e.triggerAtMillis)
          .put("label", e.label)
          .put("repeatDays", days)
          .put("missionKind", e.missionKind)
      )
    }
    context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_ALARMS, arr.toString())
      .apply()
  }
}
