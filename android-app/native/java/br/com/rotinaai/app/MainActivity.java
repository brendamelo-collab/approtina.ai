package br.com.rotinaai.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import br.com.rotinaai.app.alarm.RotinaAlarmPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Native alarm plugin (sound, voice and full-screen alarm)
        registerPlugin(RotinaAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
