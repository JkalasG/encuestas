import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registro } from '../registro.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Registro]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'dev-secret-cambiar',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard],
  exports: [JwtGuard],
})
export class AuthModule {}
