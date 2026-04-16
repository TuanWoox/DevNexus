import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common'
import { MediasService } from './medias.service';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';

@Controller('medias')
@UseGuards(AuthGuard)
export class MediasController {
    constructor(
        private readonly mediaService: MediasService
    ) { }

    @Get(':filename')
    getMedia(@Param('filename') fileName: string, @Res() res: Response) {
        return this.mediaService.getMedia(fileName, res);
    }
}
