import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import cors from 'cors';
import validateMediaFile from './testImage.js';
import processImage from './imageProcess.js';

// __dirname 구현 (ES 모듈 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;
// cors 설정
app.use(
    cors({
        origin: '*', // 클라이언트 도메인
    })
);

// 디렉토리 설정
const profileImageDir = path.join(__dirname, 'uploads/profileImage');
const postImageDir = path.join(__dirname, 'uploads/postImage');
const cacheDir = path.join(__dirname, 'cache');

// 디렉토리가 없으면 생성
const ensureDirectories = async () => {
    try {
        await fs.mkdir(profileImageDir, { recursive: true });
        await fs.mkdir(postImageDir, { recursive: true });
        await fs.mkdir(cacheDir, { recursive: true });
    } catch (err) {
        console.error('Error creating directories:', err);
    }
};
await ensureDirectories();

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('Request URL:', req.originalUrl); // 요청 URL 디버깅
        if (req.originalUrl === '/upload/profileImage') {
            cb(null, profileImageDir);
        } else if (req.originalUrl === '/upload/postImage') {
            cb(null, postImageDir);
        } else {
            console.error('Invalid upload path:', req.originalUrl);
            cb(new Error('Invalid upload path'), null);
        }
    },
    filename: (req, file, cb) => {
        // 랜덤 파일명 생성
        const randomName = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname);
        const timestamp = Date.now(); // 밀리초 단위의 현재 시간
        cb(null, `${randomName}_${timestamp}${extension}`);
    },
});

const upload = multer({ storage });


app.post('/upload/profileImage', upload.single('file'), validateMediaFile, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.filename;
    const fileUrl = `/uploads/profileImage/${fileName}`;
    res.status(200).json({
        message: 'Profile image uploaded and validated successfully',
        fileName,
        fileUrl,
    });
});


// 게시물 이미지 업로드
app.post('/upload/postImage', upload.single('file'), validateMediaFile, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.filename;
    const fileUrl = `/uploads/postImage/${fileName}`;
    res.status(200).json({
        message: 'Post image uploaded successfully',
        fileUrl,
    });
});

// 프로필 이미지 크기 조정 라우트
app.get('/uploads/profileImage/:imageName', async (req, res) => {
    const { imageName } = req.params;
    const { width, height } = req.query;

    try {
        const cachedImagePath = await processImage(
            profileImageDir,
            imageName,
            width,
            height
        );
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.sendFile(cachedImagePath);
    } catch (err) {
        console.error('Error processing profile image:', err);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

// 게시물 이미지 크기 조정 라우트
app.get('/uploads/postImage/:imageName', async (req, res) => {
    const { imageName } = req.params;
    const { width, height } = req.query;

    try {
        const cachedImagePath = await processImage(
            postImageDir,
            imageName,
            width,
            height
        );
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.sendFile(cachedImagePath);
    } catch (err) {
        console.error('Error processing post image:', err);
        res.status(500).json({ error: 'Failed to process image' });
    }
});


// 서버 실행
app.listen(PORT, () => {
    console.log(`Storage server is running at http://localhost:${PORT}`);
});
