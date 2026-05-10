import { Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { JWTPayloadDTO } from '../../shared/dtos/JWTPayloadDTO';

@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
    constructor(@Inject(REQUEST) private request: any) {

    }

    getProfileId(): string {
        return this.request?.user?.profileId;
    }

    getUsername(): string | undefined {
        return this.request?.user?.username;
    }

    getRole(): string | undefined {
        return this.request?.user?.role;
    }

    getUser(): JWTPayloadDTO {
        return this.request?.user;
    }
}
