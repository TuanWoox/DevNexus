import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediasService } from './medias.service';
import type { Response } from 'express';

@Controller('medias')
export class MediasController {
    constructor(
        private readonly mediaService: MediasService
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return await this.mediaService.handleUpload(file);
    }

    @Get('videos/:filename')
    getVideo(@Param('filename') fileName: string, @Res() res: Response) {
        return this.mediaService.getVideo(fileName, res);
    }
    @Get('images/:filename')
    getImage(@Param('filename') fileName: string, @Res() res: Response) {
        return this.mediaService.getImage(fileName, res);
    }
    @Get('files/:filename')
    getFile(@Param('filename') fileName: string, @Res() res: Response) {
        return this.mediaService.getFile(fileName, res);
    }
}
