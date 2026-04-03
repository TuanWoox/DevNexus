import { Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { JWTPayloadDTO } from "src/shared/dtos/JWTPayloadDTO";

@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
    constructor(@Inject(REQUEST) private request: any) {

    }

    getProfileId(): string {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return this.request?.user?.profileId;
    }

    getUsername(): string | undefined {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return this.request?.user?.username;
    }

    getRole(): string | undefined {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return this.request?.user?.role;
    }

    getUser(): JWTPayloadDTO {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return this.request?.user;
    }
}
