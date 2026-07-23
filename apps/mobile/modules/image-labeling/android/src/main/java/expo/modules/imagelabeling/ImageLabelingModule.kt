package expo.modules.imagelabeling

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.atomic.AtomicReference

/**
 * Expo native module: camera capture + Google ML Kit on-device image labeling.
 *
 * Used during alarm setup to register a photo-object mission fingerprint
 * (top labels with confidences). Requires a custom dev client / prebuild.
 */
class ImageLabelingModule : Module() {
  private val pendingCapture = AtomicReference<PendingCapture?>(null)
  private var captureRequestCode = REQUEST_IMAGE_CAPTURE

  override fun definition() = ModuleDefinition {
    Name("ImageLabeling")

    /**
     * Run ML Kit image labeling on an existing local file / content URI.
     * Returns list of { text, confidence } maps sorted by confidence desc.
     */
    AsyncFunction("labelImage") { uriString: String, promise: Promise ->
      val context = appContext.reactContext
        ?: return@AsyncFunction promise.reject(Exceptions.ReactContextLost())
      try {
        val uri = Uri.parse(uriString)
        val bitmap = loadBitmap(context, uri)
          ?: return@AsyncFunction promise.reject(
            "E_LOAD_IMAGE",
            "Could not decode image at $uriString",
            null
          )
        runLabeling(bitmap, promise)
      } catch (e: Exception) {
        promise.reject("E_LABEL_IMAGE", e.message, e)
      }
    }

    /**
     * Launch the system camera, then run ML Kit on the captured photo.
     * Resolves with { uri, labels: [{ text, confidence }, ...] }.
     */
    AsyncFunction("captureAndLabel") { promise: Promise ->
      val activity = appContext.currentActivity
        ?: return@AsyncFunction promise.reject(Exceptions.MissingActivity())
      val context = appContext.reactContext
        ?: return@AsyncFunction promise.reject(Exceptions.ReactContextLost())

      if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
        != PackageManager.PERMISSION_GRANTED
      ) {
        return@AsyncFunction promise.reject(
          "E_NO_CAMERA_PERMISSION",
          "Camera permission is required to photograph a target object",
          null
        )
      }

      if (pendingCapture.get() != null) {
        return@AsyncFunction promise.reject(
          "E_CAPTURE_IN_PROGRESS",
          "A capture is already in progress",
          null
        )
      }

      try {
        val dir = File(context.cacheDir, "image_labeling").apply { mkdirs() }
        val photoFile = File(dir, "capture_${System.currentTimeMillis()}.jpg")
        val contentUri = FileProvider.getUriForFile(
          context,
          "${context.packageName}.imagelabeling.fileprovider",
          photoFile
        )

        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
          putExtra(MediaStore.EXTRA_OUTPUT, contentUri)
          addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        // Grant write to camera apps that need it.
        val resInfoList = context.packageManager.queryIntentActivities(
          intent,
          PackageManager.MATCH_DEFAULT_ONLY
        )
        for (resolveInfo in resInfoList) {
          val packageName = resolveInfo.activityInfo.packageName
          context.grantUriPermission(
            packageName,
            contentUri,
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION
          )
        }

        if (intent.resolveActivity(context.packageManager) == null) {
          return@AsyncFunction promise.reject(
            "E_NO_CAMERA",
            "No camera app available on this device",
            null
          )
        }

        pendingCapture.set(
          PendingCapture(
            promise = promise,
            photoFile = photoFile,
            contentUri = contentUri
          )
        )
        activity.startActivityForResult(intent, captureRequestCode)
      } catch (e: Exception) {
        pendingCapture.set(null)
        promise.reject("E_CAPTURE_START", e.message, e)
      }
    }

    /**
     * Whether the native ML Kit module is linked (always true when this runs).
     */
    Function("isAvailable") {
      true
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != captureRequestCode) return@OnActivityResult
      val pending = pendingCapture.getAndSet(null) ?: return@OnActivityResult

      if (payload.resultCode != Activity.RESULT_OK) {
        pending.photoFile.delete()
        pending.promise.reject("E_CAPTURE_CANCELLED", "Photo capture was cancelled", null)
        return@OnActivityResult
      }

      try {
        val context = appContext.reactContext
          ?: throw IllegalStateException("React context lost after capture")

        // Prefer the full-res file written via EXTRA_OUTPUT.
        var bitmap: Bitmap? = null
        if (pending.photoFile.exists() && pending.photoFile.length() > 0L) {
          bitmap = BitmapFactory.decodeFile(pending.photoFile.absolutePath)
        }
        // Fallback: some devices only return a thumbnail in the intent.
        if (bitmap == null) {
          val thumb = payload.data?.extras?.get("data") as? Bitmap
          if (thumb != null) {
            FileOutputStream(pending.photoFile).use { out ->
              thumb.compress(Bitmap.CompressFormat.JPEG, 92, out)
            }
            bitmap = thumb
          }
        }

        if (bitmap == null) {
          pending.promise.reject("E_CAPTURE_EMPTY", "Camera returned no image data", null)
          return@OnActivityResult
        }

        val fileUri = Uri.fromFile(pending.photoFile).toString()
        runLabeling(bitmap) { labels, error ->
          if (error != null) {
            pending.promise.reject("E_LABEL_IMAGE", error.message, error)
          } else {
            pending.promise.resolve(
              mapOf(
                "uri" to fileUri,
                "labels" to labels
              )
            )
          }
        }
      } catch (e: Exception) {
        pending.promise.reject("E_CAPTURE_PROCESS", e.message, e)
      }
    }
  }

  private fun runLabeling(bitmap: Bitmap, promise: Promise) {
    runLabeling(bitmap) { labels, error ->
      if (error != null) {
        promise.reject("E_LABEL_IMAGE", error.message, error)
      } else {
        promise.resolve(labels)
      }
    }
  }

  private fun runLabeling(
    bitmap: Bitmap,
    callback: (labels: List<Map<String, Any>>, error: Exception?) -> Unit
  ) {
    val image = InputImage.fromBitmap(bitmap, 0)
    val options = ImageLabelerOptions.Builder()
      .setConfidenceThreshold(CONFIDENCE_THRESHOLD)
      .build()
    val labeler = ImageLabeling.getClient(options)

    labeler.process(image)
      .addOnSuccessListener { labels ->
        val mapped = labels
          .sortedByDescending { it.confidence }
          .take(MAX_LABELS)
          .map { label ->
            mapOf(
              "text" to label.text,
              "confidence" to label.confidence.toDouble()
            )
          }
        try {
          labeler.close()
        } catch (_: Exception) {
        }
        callback(mapped, null)
      }
      .addOnFailureListener { e ->
        try {
          labeler.close()
        } catch (_: Exception) {
        }
        callback(emptyList(), e)
      }
  }

  private fun loadBitmap(context: android.content.Context, uri: Uri): Bitmap? {
    return try {
      when (uri.scheme) {
        "file" -> BitmapFactory.decodeFile(uri.path)
        "content" -> {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val source = ImageDecoder.createSource(context.contentResolver, uri)
            ImageDecoder.decodeBitmap(source) { decoder, _, _ ->
              decoder.isMutableRequired = false
            }
          } else {
            @Suppress("DEPRECATION")
            MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
          }
        }
        else -> {
          // Bare path
          BitmapFactory.decodeFile(uri.path ?: uri.toString())
        }
      }
    } catch (_: Exception) {
      null
    }
  }

  private data class PendingCapture(
    val promise: Promise,
    val photoFile: File,
    val contentUri: Uri
  )

  companion object {
    private const val REQUEST_IMAGE_CAPTURE = 0xD10C
    private const val CONFIDENCE_THRESHOLD = 0.5f
    private const val MAX_LABELS = 10
  }
}
