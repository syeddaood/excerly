package com.alarmapp.alarm

import android.app.Activity
import android.os.Bundle
import android.view.WindowManager
import android.widget.TextView

class FullScreenAlarmActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        val textView = TextView(this)
        textView.text = "Alarm! Wake up!"
        textView.textSize = 32f
        setContentView(textView)
    }
}
