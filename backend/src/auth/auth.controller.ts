import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Get('config')
  config() {
    return {
      googleClientId: process.env.GOOGLE_CLIENT_ID || null,
      registroAbierto: false,
      modoEspecial: process.env.MODO_ESPECIAL === 'true',
    };
  }
  @UseGuards(JwtGuard) @Post('registro') registro(@Body() b: any) { return this.auth.crearUsuarioAdmin(b.nombre, b.email, b.password); }
  @UseGuards(JwtGuard) @Get('usuarios') listarUsuarios() { return this.auth.listarUsuarios(); }
  @UseGuards(JwtGuard) @Post('usuarios') crearUsuario(@Body() b: any) { return this.auth.crearUsuarioAdmin(b.nombre, b.email, b.password); }
  @UseGuards(JwtGuard) @Delete('usuarios/:id') eliminarUsuario(@Param('id') id: string, @Req() req: any) { return this.auth.eliminarUsuario(id, req.usuario.id); }
  @Post('login') login(@Body() b: any) { return this.auth.login(b.email, b.password); }
  @Post('google') google(@Body() b: any) { return this.auth.loginGoogle(b.credential); }
  @UseGuards(JwtGuard) @Get('yo') yo(@Req() req: any) { return req.usuario; }
}
