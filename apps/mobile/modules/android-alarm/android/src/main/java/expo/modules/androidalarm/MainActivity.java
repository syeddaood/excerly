package expo.modules.androidalarm;

import android.os.Bundle;
import com.facebook.react.ReactActivity;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.app.AlertDialog;
import android.content.DialogInterface;

public class MainActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestPermissions();
        checkBatteryOptimization();
    }

    private void requestPermissions() {
        PermissionsHandler.requestScheduleExactAlarmPermission(this);
        PermissionsHandler.requestPostNotificationsPermission(this);
    }

    private void checkBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                new AlertDialog.Builder(this)
                        .setTitle("Battery Optimization")
                        .setMessage("Please whitelist this app from battery optimization.")
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                                startActivity(intent);
                            }
                        })
                        .setNegativeButton("Cancel", null)
                        .show();
            }
        }
    }
}
