import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import pLimit from 'p-limit';
import { PrismaService } from '../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { ORBS_SYMBOLS_URL, BINANCE_KLINES_BASE_URL } from 'src/common/constants';
import { OrbsApiResponse } from 'src/common/types';

const INTERVAL = '1d';
const MAX_LIMIT = 1500;
const CONCURRENCY_LIMIT = 10;

const limit = pLimit(CONCURRENCY_LIMIT);

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUniqueSymbols(): Promise<string[]> {
    try {
        const response = await fetch(ORBS_SYMBOLS_URL);
        if (!response.ok) {
            throw new Error(
                `Failed to fetch market data: ${response.statusText}`
            );
        }
        const data: OrbsApiResponse = await response.json();
        const rawSymbols = data.symbols.map((s) => s.name);
        const unique = Array.from(new Set(rawSymbols));
        return unique;
    } catch (err) {
      this.logger.error('Error fetching symbols:', err);
      return [];
    }
  }


  async fetchKlines(symbol: string): Promise<any[]> {
    const endTime = Date.now();
    const startTime = endTime - 365 * 24 * 60 * 60 * 1000;

    try {
      const response = await axios.get(BINANCE_KLINES_BASE_URL, {
        params: {
          symbol,
          interval: INTERVAL,
          startTime,
          endTime,
          limit: MAX_LIMIT,
        },
      });
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 429) {
        this.logger.warn(`Rate limit hit for ${symbol}, retrying after 1s...`);
        await new Promise((res) => setTimeout(res, 1000));
        return this.fetchKlines(symbol);
      } else {
        this.logger.error(`Error for ${symbol}:`, err.message);
        return [];
      }
    }
  }

  async fetchAndStoreHistoricalData(): Promise<void> {
    const symbols = await this.getUniqueSymbols();
    this.logger.log(`Fetched ${symbols.length} unique symbols.`);

    const tasks = symbols.map((symbol) =>
      limit(async () => {
        const klines = await this.fetchKlines(symbol);
        console.log(`kline response for ${symbol} :\n${klines}`)
        for (const kline of klines) {
          const record = {
            asset_symbol: symbol,
            price_date: new Date(kline[0]),
            open: new Decimal(kline[1]),
            high: new Decimal(kline[2]),
            low: new Decimal(kline[3]),
            close: new Decimal(kline[4]),
            volume: new Decimal(kline[5]),
          };
          console.log(`Record for ${symbol}:`, record);
        //   try {
        //     await this.prisma.historical_prices.upsert({
        //       where: {
        //         asset_symbol_price_date: {
        //           asset_symbol: record.asset_symbol,
        //           price_date: record.price_date,
        //         },
        //       },
        //       update: record,
        //       create: record,
        //     });
        //   } catch (error: any) {
        //     this.logger.error(
        //       `Failed to upsert ${symbol} record for ${record.price_date}: ${error.message}`,
        //     );
        //   }
        }
        this.logger.log(`✅ ${symbol} - ${klines.length} candles stored`);
      }),
    );

    await Promise.all(tasks);
    this.logger.log('Historical price fetch and store complete.');
  }
}