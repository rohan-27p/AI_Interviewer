import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import os from "os"; // Import OS for temp dir
import { v4 as uuidv4 } from "uuid";

const execAsync = util.promisify(exec);

export async function generateAudio(text: string): Promise<string> {
    const id = uuidv4();

    // ✅ FIX 1: Use system temp folder (Prevents permission errors)
    const outputFileName = `output-${id}.mp3`;
    const outputPath = path.join(os.tmpdir(), outputFileName);

    // Escape quotes to prevent crashing the command
    const safeText = text.replace(/"/g, '\\"').replace(/\n/g, " ");

    try {
        // ✅ FIX 2: Use "python -m edge_tts"
        // This bypasses the "command not found" issue on Windows
        await execAsync(`python -m edge_tts --text "${safeText}" --write-media "${outputPath}" --voice en-US-ChristopherNeural`);

        // Read the file into a buffer
        const fileBuffer = await fs.promises.readFile(outputPath);

        // Convert to Base64
        const base64Audio = fileBuffer.toString("base64");

        // Cleanup: Delete the temp file
        await fs.promises.unlink(outputPath);

        return base64Audio;
    } catch (error) {
        console.error("TTS Logic Error:", error);
        throw new Error("Failed to generate audio");
    }
}