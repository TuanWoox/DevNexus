import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../prisma-database/prisma.service";
import { Logger } from "@nestjs/common";

interface UnmuteData {
    chatSettingId: string
}

@Processor('chatsetting')
export class ChatSettingProcessor extends WorkerHost {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly logger: Logger
    ) {
        super();

    }

    async process(job: Job) {
        try {
            switch (job.name) {
                case 'unMute':
                    await this.unMuteChatSetting(job.data as UnmuteData);
                    break;
                default:
                    this.logger.log("Does not match any pattern")
            }
        }
        catch (ex) {
            this.logger.log(ex)
        }

    }

    private async unMuteChatSetting(data: UnmuteData) {
        try {
            await this.prismaService.chatSetting.update({
                where: {
                    Id: data.chatSettingId,
                },
                data: {
                    MuteUntil: null,
                    IsMuted: false,
                }
            })
        }
        catch (ex) {
            this.logger.log(ex)
        }
    }
}