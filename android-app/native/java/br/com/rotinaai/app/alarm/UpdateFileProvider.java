package br.com.rotinaai.app.alarm;

import androidx.core.content.FileProvider;

/** Shares the downloaded update with the Android installer (own class so it never clashes with other providers). */
public class UpdateFileProvider extends FileProvider {
}
