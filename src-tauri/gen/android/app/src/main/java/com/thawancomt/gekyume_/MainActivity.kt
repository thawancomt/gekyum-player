package com.thawancomt.gekyume_

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat

import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    
    val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
    windowInsetsController.apply {
        hide(WindowInsetsCompat.Type.systemBars())
        systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
    window.statusBarColor = android.graphics.Color.TRANSPARENT
    window.navigationBarColor = android.graphics.Color.TRANSPARENT

    requestStoragePermissionIfNeeded()
  }

  private fun requestStoragePermissionIfNeeded() {
    val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      arrayOf(Manifest.permission.READ_MEDIA_AUDIO)
    } else {
      arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
    }

    if (!PermissionHelper.hasPermissions(this, permissions)) {
      ActivityCompat.requestPermissions(this, permissions, 1001)
    }
  }
}
