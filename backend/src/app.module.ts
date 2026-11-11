import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { Registro } from './registro.entity';
import { Seed } from './seed';
import { AuthModule } from './auth/auth.module';
import { EncuestasModule } from './encuestas/encuestas.module';

mkdirSync('data', { recursive: true });

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/encuestas.sqlite',
      entities: [Registro],
      synchronize: true, // una sola tabla pequena: el esquema se crea solo
      prepareDatabase: (db: any) => {
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
      },
    }),
    AuthModule,
    TypeOrmModule.forFeature([Registro]),
    EncuestasModule,
  ],
  providers: [Seed],
})
export class AppModule {}
