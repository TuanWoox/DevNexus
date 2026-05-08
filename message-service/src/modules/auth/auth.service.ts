import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import "dotenv/config"


@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }

    validateToken(token: string) {
        const payload = this.jwtService.verify(token);

        return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            profileId: payload.profileId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            username: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            role: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            exp: payload.exp as number,
        };
    }

    getTokenExpiration(token: string): number {
        const payload = this.jwtService.verify(token);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return payload.exp as number;
    }
}