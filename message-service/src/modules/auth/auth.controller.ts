import { Body, Controller, Post, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('set-cookie')
    setCookie(@Body('accessToken') accessToken: string, @Res({ passthrough: true }) res: Response) {
        if (!accessToken) {
            throw new UnauthorizedException('No access token provided');
        }

        let exp: number;
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            exp = this.authService.getTokenExpiration(accessToken);
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }

        // Tie cookie maxAge to the JWT's actual expiration
        const maxAge = Math.max(0, exp * 1000 - Date.now());

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/message-service',
            maxAge,
            secure: false,
        });

        return { ok: true };
    }
}
