import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { InitialSyncService } from './modules/initial-sync/initial-sync.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('notification-service/api');

  // Perform blocking initial sync
  const syncService = app.get(InitialSyncService);
  await syncService.performInitialSync();


  await app.listen(3002);
}

bootstrap().catch((err) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
