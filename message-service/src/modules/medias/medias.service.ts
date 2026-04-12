/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { validateUploadByType } from 'src/utils/helper/validateFileUpload';
import { randomUUID } from 'crypto';
import { extname } from 'path';


@Injectable()
export class MediasService {
    constructor() { }

    async handleUpload(file: Express.Multer.File) {
        const returnResult = new ReturnResult();
        try {

            const validateResult = validateUploadByType(file)
            if (validateResult.Message) {
                returnResult.Message = validateResult.Message;
                return returnResult;
            }

            let uploadPath: string;

            if (file.mimetype.startsWith('image/')) {
                uploadPath = join(__dirname, '..', '..', '..', 'upload/images');
            } else if (file.mimetype.startsWith('video/')) {
                uploadPath = join(__dirname, '..', '..', '..', 'upload/videos');
            } else {
                uploadPath = join(__dirname, '..', '..', '..', 'upload/files');
            }

            const ext = extname(file.originalname).toLowerCase();
            const filename = `${randomUUID()}${ext}`;
            const fullPath = join(uploadPath, filename);

            // exactly like stream.CopyToAsync(targetStream) in C#
            await writeFile(fullPath, file.buffer);

            returnResult.Result = filename;


        } catch (ex) {
            returnResult.Message = ex instanceof Error ? ex.message : String(ex);
        }
        return returnResult;
    }

    getImage(fileName: string, res: Response) {
        const filePath = join(__dirname, '../../..', 'upload/images', fileName);
        res.sendFile(filePath);
    }

    getVideo(fileName: string, res: Response) {
        const filePath = join(__dirname, '../../..', 'upload/videos', fileName);
        res.sendFile(filePath);
    }

    getFile(fileName: string, res: Response) {
        const filePath = join(__dirname, '../../..', 'upload/files', fileName);
        res.sendFile(filePath);
    }

}
