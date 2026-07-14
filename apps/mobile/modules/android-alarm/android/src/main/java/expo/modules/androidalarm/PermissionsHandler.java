package expo.modules.androidalarm;

import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class PermissionsHandler {
    private static final int REQUEST_SCHEDULE_EXACT_ALARM = 1;
    private static final int REQUEST_POST_NOTIFICATIONS = 2;

    public static void requestScheduleExactAlarmPermission(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(activity, "android.permission.SCHEDULE_EXACT_ALARM") != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(activity, new String[]{"android.permission.SCHEDULE_EXACT_ALARM"}, REQUEST_SCHEDULE_EXACT_ALARM);
            }
        }
    }

    public static void requestPostNotificationsPermission(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(activity, "android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(activity, new String[]{"android.permission.POST_NOTIFICATIONS"}, REQUEST_POST_NOTIFICATIONS);
            }
        }
    }
}
