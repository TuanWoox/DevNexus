import { Module } from '@nestjs/common';
import { PrismaDatabaseModule } from '../prisma-database/prisma-database.module';
import { ProfilechatsService } from './profilechats.service';


@Module({
    imports: [PrismaDatabaseModule],
    providers: [ProfilechatsService],
    exports: [ProfilechatsService],
})
export class ProfilechatsModule { }
