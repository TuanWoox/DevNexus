import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);

  console.log("HTTP server running on :3000");
}

bootstrap().catch((err) => {
  console.error("Failed to start application", err);
  process.exit(1);
});