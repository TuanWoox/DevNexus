import { Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';

@Module({
    imports: [],
    controllers: [MediasController],
    providers: [MediasService],
    exports: [MediasService]

})
export class MediasModule { }
