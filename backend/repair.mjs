import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Repairs an MP4 file by remuxing it with faststart flags.
 * If simple remux fails, it tries to re-encode.
 */
export async function repairMp4(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`[FFmpeg] Repairing MP4: ${inputPath}`);
        ffmpeg(inputPath)
            .outputOptions([
                '-err_detect', 'ignore_err',
                '-c', 'copy',
                '-movflags', '+faststart'
            ])
            .on('end', () => {
                console.log('[FFmpeg] MP4 Remux Success');
                resolve(true);
            })
            .on('error', (err) => {
                console.warn('[FFmpeg] Remux failed, trying re-encode...', err.message);
                // Fallback: Re-encode
                ffmpeg(inputPath)
                    .outputOptions(['-map', '0', '-c:v', 'libx264', '-c:a', 'aac']) // Corrected 'tputOptions' to 'outputOptions'
                    .on('end', () => {
                        console.log('[FFmpeg] MP4 Re-encode Success');
                        resolve(true);
                    })
                    .on('error', (reErr) => {
                        console.error('[FFmpeg] Fatal Repair Error:', reErr.message);
                        reject(reErr);
                    })
                    .save(outputPath);
            })
            .save(outputPath);
    });
}

/**
 * Repairs a JPG file by rewriting it or extracting thumbnails.
 */
export async function repairJpg(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`[FFmpeg] Repairing JPG: ${inputPath}`);

        // Strategy 1: Standard re-encode with high quality
        ffmpeg(inputPath)
            .outputOptions(['-q:v', '2'])
            .on('end', () => {
                console.log('[FFmpeg] JPG Strategy 1 (Standard) Success');
                resolve(true);
            })
            .on('error', (err) => {
                console.warn('[FFmpeg] JPG Strategy 1 failed, trying Strategy 2 (Ignore Errors)...', err.message);

                // Strategy 2: Ignore errors and force mjpeg
                ffmpeg(inputPath)
                    .inputOptions(['-err_detect', 'ignore_err'])
                    .outputOptions(['-q:v', '2', '-f', 'image2'])
                    .on('end', () => {
                        console.log('[FFmpeg] JPG Strategy 2 (Ignore Errors) Success');
                        resolve(true);
                    })
                    .on('error', (reErr) => {
                        console.warn('[FFmpeg] JPG Strategy 2 failed, trying Strategy 3 (Forced MJPEG Format)...', reErr.message);

                        // Strategy 3: Most aggressive - treat everything as mjpeg stream
                        ffmpeg(inputPath)
                            .inputFormat('mjpeg')
                            .outputOptions(['-q:v', '5']) // Lower quality but more tolerant
                            .on('end', () => {
                                console.log('[FFmpeg] JPG Strategy 3 (Forced MJPEG) Success');
                                resolve(true);
                            })
                            .on('error', (lastErr) => {
                                console.error('[FFmpeg] JPG Final Failure:', lastErr.message);
                                reject(lastErr);
                            })
                            .save(outputPath);
                    })
                    .save(outputPath);
            })
            .save(outputPath);
    });
}
