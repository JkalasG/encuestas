import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registro } from '../registro.entity';
import { EncuestasController, PublicoController } from './encuestas.controller';
import { EncuestasService } from './encuestas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Registro])],
  controllers: [EncuestasController, PublicoController],
  providers: [EncuestasService],
})
export class EncuestasModule {}
