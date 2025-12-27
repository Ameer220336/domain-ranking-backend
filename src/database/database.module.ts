import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

@Global()
@Module({
  providers: [
    {
      provide: 'DB_POOL',
      useFactory: () => {
        return new Pool({
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          ssl: process.env.DB_HOST?.includes('neon.tech') ? {
            rejectUnauthorized: false,
          } : false,
        });
      },
    },
  ],
  exports: ['DB_POOL'],
})
export class DatabaseModule {}