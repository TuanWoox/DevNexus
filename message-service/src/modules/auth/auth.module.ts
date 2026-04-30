import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UserContextService } from './userContext.service';

@Global()
@Module({
    imports: [JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET_KEY'),
            verifyOptions: {
                audience: configService.get<string>('JWT_AUDIENCE'),
                issuer: configService.get<string>('JWT_ISSUER'),
            },
        }),
    })
    ],
    providers: [AuthService, AuthGuard, UserContextService],
    exports: [AuthService, AuthGuard, UserContextService]
})
export class AuthModule { }

