import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import crypto from 'crypto';


// __dirname 구현 (ES 모듈 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 프로필 이미지와 게시물 이미지의 업로드 디렉토리 설정
const profileImageDir = path.join(__dirname, 'uploads/profileImage');
const postImageDir = path.join(__dirname, 'uploads/postImage');

// 디렉토리가 없으면 생성
const ensureDirectories = async () => {
    try {
        await fs.mkdir(profileImageDir, { recursive: true });
        await fs.mkdir(postImageDir, { recursive: true });
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
        cb(null, `${randomName}${extension}`);
    },
});

const upload = multer({ storage });

// 정적 파일 제공 (이미지를 URL로 접근 가능)
app.use('/uploads/profileImage', express.static(profileImageDir));
app.use('/uploads/postImage', express.static(postImageDir));

// 프로필 이미지 업로드
app.post('/upload/profileImage', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.filename;
    const fileUrl = `/uploads/profileImage/${fileName}`;
    res.status(200).json({
        message: 'Profile image uploaded successfully',
        fileName,
        fileUrl,
    });
});

// 게시물 이미지 업로드
app.post('/upload/postImage', upload.single('file'), (req, res) => {
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

// 서버 실행
app.listen(PORT, () => {
    console.log(`Storage server is running at http://localhost:${PORT}`);
});
