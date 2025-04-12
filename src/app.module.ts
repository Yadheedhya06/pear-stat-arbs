import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BinanceService } from './modules/binance/binance.service';
import { PrismaService } from './modules/database/prisma.service';
// import { BinanceModule } from './modules/binance/binance.module';
// import { StatsModule } from './modules/stats/stats.module';
// import { DatabaseModule } from './modules/database/database.module';
// import { TasksModule } from './schedule/tasks.module';
// import { ConfigModule } from '../config/config.module';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, BinanceService, PrismaService],
})
export class AppModule {}
