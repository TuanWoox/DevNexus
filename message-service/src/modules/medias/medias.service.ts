/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { validateUploadByType } from 'src/utils/helper/validateFileUpload';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { MediaType } from 'src/generated/prisma/enums';
import { AuthGuard } from '../auth/auth.guard';
import { ConfigService } from '@nestjs/config';
import { platform } from 'os';

@Injectable()
@UseGuards(AuthGuard)
export class MediasService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userContext: UserContextService,
        private readonly configService: ConfigService
    ) {

    }

    async handleUpload(file: Express.Multer.File, messageId: number) {
        const returnResult = new ReturnResult();

        try {
            // 1. Validate early
            const validateResult = validateUploadByType(file);
            if (validateResult.Message) {
                returnResult.Message = validateResult.Message;
                return returnResult; // Early exit
            }

            // 2. Determine routing & properties
            const { type, folder } = this.getMediaInfo(file.mimetype);

            // Construct paths cleanly
            const isWindows = platform() === 'win32';
            const configuredUploadDir = this.configService.get<string>(isWindows ? 'UPLOAD_FOLDER_WINDOWS' : 'UPLOAD_FOLDER_LINUX');
            const basePath = configuredUploadDir || join(__dirname, '..', '..', '..', 'upload');
            const uploadPath = join(basePath, folder);

            const ext = extname(file.originalname).toLowerCase();
            const filename = `${Date.now()}-${randomUUID()}${ext}`;
            const fullPath = join(uploadPath, filename);

            // 3. Save to disk
            await writeFile(fullPath, file.buffer);

            // 4. Save to Database with fallback
            try {
                await this.prismaService.media.create({
                    data: {
                        MediaName: filename,
                        Type: type,
                        MessageId: messageId
                    }
                });
            } catch (dbError) {
                // CLEANUP: If the DB fails, delete the file so you don't leak disk space
                await unlink(fullPath).catch(err => {
                    // Log this failure in your actual app (e.g., console.error or a logger service)
                    console.error(`Failed to cleanup orphaned file: ${fullPath}`, err);
                });
                throw dbError; // Pass the error to the main catch block
            }

            returnResult.Result = filename;

        } catch (ex) {
            returnResult.Message = ex instanceof Error ? ex.message : String(ex);
        }

        return returnResult;
    }

    async getMedia(fileName: string, res: Response) {
        try {
            const mediaExist = await this.prismaService.media.findFirst({
                where: {
                    Deleted: false,
                    MediaName: fileName
                },
                include: {
                    Message: {
                        select: {
                            ChatId: true
                        }
                    }
                }
            })
            if (mediaExist) {
                const canAccess = await this.prismaService.profileChat.findFirst({
                    where: {
                        MemberId: this.userContext.getProfileId()
                    }
                })
                if (canAccess) {
                    const isWindows = platform() === 'win32';
                    const configuredUploadDir = this.configService.get<string>(isWindows ? 'UPLOAD_FOLDER_WINDOWS' : 'UPLOAD_FOLDER_LINUX');
                    const basePath = configuredUploadDir || join(__dirname, '..', '..', '..', 'upload');

                    switch (mediaExist.Type) {
                        case MediaType.Image: {
                            const filePath = join(basePath, 'images', fileName);
                            return res.sendFile(filePath);
                        }

                        case MediaType.Video: {
                            const filePath = join(basePath, 'videos', fileName);
                            return res.sendFile(filePath);
                        }

                        case MediaType.File: { // assuming you meant something else here
                            const filePath = join(basePath, 'files', fileName);
                            return res.sendFile(filePath);
                        }
                        default: {
                            return res.status(400).send('Unsupported media type');
                        }
                    }
                } else return res.status(403).send('Forbidden');
            }
            return res.status(404).send('Not Found');
        }
        catch (ex) {
            console.log(ex);
        }
    }

    getMediaInfo(mimetype: string) {
        if (mimetype.startsWith('image/')) return { type: MediaType.Image, folder: 'images' };
        if (mimetype.startsWith('video/')) return { type: MediaType.Video, folder: 'videos' };
        return { type: MediaType.File, folder: 'files' };
    };
}
