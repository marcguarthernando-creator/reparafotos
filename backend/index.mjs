import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { repairMp4, repairJpg } from './repair.mjs';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

app.get('/health', (req, res) => res.send('OK'));

app.post('/process/:jobId', async (req, res) => {
    const { jobId } = req.params;
    console.log(`[Backend] Starting processing for Job: ${jobId}`);

    try {
        // 1. Get files for this job
        const { data: files, error } = await supabase
            .from('files')
            .select('*')
            .eq('job_id', jobId)
            .eq('repair_status', 'pending');

        if (error) throw error;
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No pending files found for this job' });
        }

        res.json({ message: 'Processing started', count: files.length });

        // Background processing
        for (const fileItem of files) {
            try {
                await processSingleFile(fileItem);
            } catch (err) {
                console.error(`[Backend] Failed to process file ${fileItem.id}:`, err);
            }
        }

        // Update job status when done
        await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId);

    } catch (error) {
        console.error('[Backend] Job Processing Error:', error);
        res.status(500).json({ error: error.message });
    }
});

async function processSingleFile(fileItem) {
    const tmpDir = path.join(__dirname, 'tmp', fileItem.job_id);
    await fs.mkdir(tmpDir, { recursive: true });

    const inputPath = path.join(tmpDir, `input_${fileItem.id}`);
    const outputPath = path.join(tmpDir, `output_${fileItem.id}`);

    try {
        // 1. Download from Supabase
        const { data, error: dlError } = await supabase.storage
            .from('originals')
            .download(fileItem.storage_path_original);

        if (dlError) throw dlError;
        const buffer = Buffer.from(await data.arrayBuffer());
        console.log(`[Backend] File ${fileItem.id} downloaded. Size: ${buffer.length} bytes`);
        await fs.writeFile(inputPath, buffer);
        console.log(`[Backend] File ${fileItem.id} written to disk.`);

        // 2. Repair
        let success = false;
        if (fileItem.file_type === 'mp4') {
            success = await repairMp4(inputPath, outputPath);
        } else {
            success = await repairJpg(inputPath, outputPath);
        }

        if (success) {
            // 3. Upload repaired file
            const repairedPath = `${fileItem.job_id}/repaired_${fileItem.id}_${fileItem.original_name}`;
            const fileBuffer = await fs.readFile(outputPath);

            const { error: upError } = await supabase.storage
                .from('repaired')
                .upload(repairedPath, fileBuffer, { contentType: fileItem.file_type === 'mp4' ? 'video/mp4' : 'image/jpeg' });

            if (upError) throw upError;

            // 4. Update Database
            await supabase.from('files').update({
                repair_status: 'repaired',
                storage_path_repaired: repairedPath
            }).eq('id', fileItem.id);
        }

    } catch (err) {
        console.error(`[Backend] Error in file ${fileItem.id}:`, err.message);
        await supabase.from('files').update({
            repair_status: 'irrecoverable',
            log_output: err.message
        }).eq('id', fileItem.id);
    } finally {
        // Cleanup
        try {
            if (await fs.stat(inputPath).catch(() => null)) await fs.unlink(inputPath);
            if (await fs.stat(outputPath).catch(() => null)) await fs.unlink(outputPath);
        } catch (e) { }
    }
}
app.get('/download-zip/:jobId', async (req, res) => {
    const { jobId } = req.params;
    console.log(`[Backend] Generating ZIP for Job: ${jobId}`);

    try {
        const { data: files, error } = await supabase
            .from('files')
            .select('*')
            .eq('job_id', jobId)
            .eq('repair_status', 'repaired');

        if (error) throw error;
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No repaired files found' });
        }

        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment(`reparafotos_${jobId}.zip`);

        archive.on('error', (err) => { throw err; });
        archive.pipe(res);

        for (const fileItem of files) {
            const { data, error: dlError } = await supabase.storage
                .from('repaired')
                .download(fileItem.storage_path_repaired);

            if (!dlError) {
                archive.append(Buffer.from(await data.arrayBuffer()), { name: fileItem.original_name });
            }
        }

        archive.finalize();

    } catch (error) {
        console.error('[Backend] ZIP Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Cleanup Logic (Run every hour) ---
async function runCleanup() {
    console.log('[Cleanup] Checking for expired jobs...');
    try {
        const { data: expiredJobs, error } = await supabase
            .from('jobs')
            .select('id')
            .lt('expires_at', new Date().toISOString());

        if (error) throw error;

        for (const job of expiredJobs) {
            console.log(`[Cleanup] Deleting job ${job.id}`);

            // Delete files from storage
            const { data: fileList } = await supabase.storage.from('originals').list(job.id);
            if (fileList?.length) {
                await supabase.storage.from('originals').remove(fileList.map(f => `${job.id}/${f.name}`));
            }

            const { data: repairedList } = await supabase.storage.from('repaired').list(job.id);
            if (repairedList?.length) {
                await supabase.storage.from('repaired').remove(repairedList.map(f => `${job.id}/${f.name}`));
            }

            // DB cascade will handle 'files' table
            await supabase.from('jobs').delete().eq('id', job.id);
        }
    } catch (err) {
        console.error('[Cleanup] Error:', err.message);
    }
}

setInterval(runCleanup, 60 * 60 * 1000); // Once an hour
runCleanup(); // Run on start

app.listen(port, () => {
    console.log(`[Backend] Server running on port ${port}`);
});
