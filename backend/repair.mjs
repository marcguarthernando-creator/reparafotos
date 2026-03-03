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
        // Try to re-encode the image to "fix" headers/data
        ffmpeg(inputPath)
            .outputOptions(['-q:v', '2']) // High quality
            .on('end', () => {
                console.log('[FFmpeg] JPG Repair Success');
                resolve(true);
            })
            .on('error', (err) => {
                console.warn('[FFmpeg] JPG basic repair failed, trying forced format...', err.message);

                // Fallback: Force mjpeg input format
                ffmpeg(inputPath)
                    .inputFormat('mjpeg')
                    .on('end', () => {
                        console.log('[FFmpeg] JPG Forced MJPEG Success');
                        resolve(true);
                    })
                    .on('error', (reErr) => {
                        console.error('[FFmpeg] JPG Fatal Error:', reErr.message);
                        reject(reErr);
                    })
                    .save(outputPath);
            })
            .save(outputPath);
    });
}
