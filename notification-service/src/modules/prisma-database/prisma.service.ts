import { Injectable } from '@nestjs/common';
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    console.log("=== DEBUG DATABASE URL ===");
    console.log("URL:", process.env.DATABASE_URL); // Thêm dòng này!
    console.log("==========================");
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }
}
