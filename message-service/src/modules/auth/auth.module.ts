import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UserContextService } from './userContext.service';

@Global()
@Module({
    imports: [JwtModule.register({
        secret: process.env.JWT_SECRET_KEY,
        verifyOptions: { audience: process.env.JWT_AUDIENCE, issuer: process.env.JWT_ISSUER }
    })
    ],
    providers: [AuthService, AuthGuard, UserContextService],
    exports: [AuthService, AuthGuard, UserContextService]
})
export class AuthModule { }
