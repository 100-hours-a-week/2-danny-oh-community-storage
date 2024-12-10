import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';

// 캐시 디렉토리 설정
const cacheDir = path.join(process.cwd(), 'cache');

const processImage = async (imageDir, imageName, width, height) => {
    const originalImagePath = path.join(imageDir, imageName);

    // width와 height가 없으면 원본 이미지 반환
    if (!width && !height) {
        console.log('No width or height specified, returning original image.');
        return originalImagePath;
    }
    // 중복방지를 위해 해시
    const cacheFileName = `${crypto
        .createHash('md5')
        .update(`${imageName}_${width}_${height}`)
        .digest('hex')}${path.extname(imageName)}`; // 원본 확장자 유지
    const cachedImagePath = path.join(cacheDir, cacheFileName);

    // 캐싱된 파일 반환
    try {
        await fs.access(cachedImagePath);
        return cachedImagePath;
    } catch {
        console.log('이미지 변환 중');
    }

    // ffmpeg로 이미지 크기 조정
    await new Promise((resolve, reject) => {
        ffmpeg(originalImagePath)
            .outputOptions([
                `-vf scale=${width || -1}:${height || -1}`, // 크기 조정
            ])
            .save(cachedImagePath)
            .on('end', resolve)
            .on('error', reject);
    });

    return cachedImagePath;
};


export default processImage;