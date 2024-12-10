import { exec } from 'child_process';
import fs from 'fs/promises';

const validateMediaFile = (req, res, next) => {
    const filePath = req.file.path; // 업로드된 파일 경로
    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            try {
                await fs.unlink(filePath); // 유효하지 않은 파일 삭제
            } catch (err) {
                console.error(`Error deleting file: ${filePath}`, err);
            }
            return res.status(400).json({ error: 'Invalid file format' });
        }

        const codecName = stdout.trim();
        const validCodecs = ['jpeg', 'mjpeg', 'png', 'gif'];
        if (!validCodecs.includes(codecName)) {
            try {
                await fs.unlink(filePath); // 유효하지 않은 파일 삭제
            } catch (err) {
                console.error(`Error deleting file: ${filePath}`, err);
            }
            return res.status(400).json({ error: `Invalid media format: ${codecName}` });
        }

        next(); // 파일이 유효하면 다음 미들웨어로 진행
    });
};


export default validateMediaFile;
