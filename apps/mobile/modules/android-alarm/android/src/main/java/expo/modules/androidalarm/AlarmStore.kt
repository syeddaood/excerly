package expo.modules.androidalarm

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Lightweight SharedPreferences-backed store of scheduled exact alarms.
 * Used so BootReceiver can reschedule after reboot without depending on JS.
 */
object AlarmStore {
  private const val PREFS = "dawnlock_exact_alarms"
  private const val KEY_ALARMS = "alarms"

  data class Entry(
    val alarmId: String,
    val triggerAtMillis: Long,
    val label: String
  )

  fun put(context: Context, alarmId: String, triggerAtMillis: Long, label: String) {
    val list = all(context).toMutableList()
    list.removeAll { it.alarmId == alarmId }
    list.add(Entry(alarmId, triggerAtMillis, label))
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
          add(
            Entry(
              alarmId = obj.getString("alarmId"),
              triggerAtMillis = obj.getLong("triggerAtMillis"),
              label = obj.optString("label", "")
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
      arr.put(
        JSONObject()
          .put("alarmId", e.alarmId)
          .put("triggerAtMillis", e.triggerAtMillis)
          .put("label", e.label)
      )
    }
    context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_ALARMS, arr.toString())
      .apply()
  }
}
