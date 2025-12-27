import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

// App imports
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Component imports
import { RankingModule } from './ranking/ranking.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    RankingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
