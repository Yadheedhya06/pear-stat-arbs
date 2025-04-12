import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BinanceService } from '../modules/binance/binance.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const binanceService = app.get(BinanceService);

  try {
    await binanceService.fetchAndStoreHistoricalData();
    console.log('Historical data fetch completed');
  } catch (error) {
    console.error('Error fetching historical data:', error);
  } finally {
    await app.close();
  }
}

bootstrap();