import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { mkdirSync } from "fs";
import { join } from "path";
import { ConfigService } from "@nestjs/config";
import { platform } from "os";
import { ClassSerializerInterceptor } from "@nestjs/common";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Create upload folder structure at startup
  const isWindows = platform() === 'win32';
  const configuredUploadDir = configService.get<string>(isWindows ? 'UPLOAD_FOLDER_WINDOWS' : 'UPLOAD_FOLDER_LINUX');
  const uploadDir = configuredUploadDir || join(__dirname, '..', 'upload');

  const uploadImagesDir = join(uploadDir, 'images');
  const uploadVideosDir = join(uploadDir, 'videos');
  const uploadFilesDir = join(uploadDir, 'files');

  try {
    mkdirSync(uploadDir, { recursive: true });
    mkdirSync(uploadImagesDir, { recursive: true });
    mkdirSync(uploadVideosDir, { recursive: true });
    mkdirSync(uploadFilesDir, { recursive: true });
    console.log("✓ Upload directories verified/created:", uploadDir);
  } catch (err) {
    console.error("✗ Failed to create upload directories", err);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  // Set global prefix for all routes
  app.setGlobalPrefix("message-service/api");

  await app.listen(3001);
}

bootstrap().catch((err) => {
  console.error("Failed to start application", err);
  process.exit(1);
});