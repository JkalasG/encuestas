import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Patch, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { EncuestasService } from './encuestas.service';

@UseGuards(JwtGuard)
@Controller('encuestas')
export class EncuestasController {
  constructor(private s: EncuestasService) {}

  @Get() listar(@Req() r: any) { return this.s.listar(r.usuario.id); }
  @Post() crear(@Req() r: any, @Body() b: any) { return this.s.crear(r.usuario.id, b); }
  @Get(':id') obtener(@Req() r: any, @Param('id') id: string) { return this.s.obtener(id, r.usuario.id); }
  @Put(':id') actualizar(@Req() r: any, @Param('id') id: string, @Body() b: any) { return this.s.actualizar(id, r.usuario.id, b); }
  @Patch(':id/estado') estado(@Req() r: any, @Param('id') id: string, @Body() b: any) { return this.s.cambiarEstado(id, r.usuario.id, b?.activo); }
  @Delete(':id') eliminar(@Req() r: any, @Param('id') id: string) { return this.s.eliminar(id, r.usuario.id); }

  @Get(':id/respuestas') respuestas(@Req() r: any, @Param('id') id: string) { return this.s.respuestas(id, r.usuario.id); }
  @Get(':id/resumen') resumen(@Req() r: any, @Param('id') id: string) { return this.s.resumen(id, r.usuario.id); }
  @Delete('respuesta/:rid') eliminarRespuesta(@Req() r: any, @Param('rid') rid: string) { return this.s.eliminarRespuesta(rid, r.usuario.id); }

  @Get(':id/exportar')
  async exportar(@Req() r: any, @Param('id') id: string, @Res() res: any) {
    const { buffer, nombre } = await this.s.exportar(id, r.usuario.id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });
    res.send(buffer);
  }
}

/** Ventana deslizante por IP, en memoria: suficiente para frenar abuso basico. */
const golpes = new Map<string, number[]>();
function limitar(ip: string, max = 20, ventanaMs = 60_000) {
  const ahora = Date.now();
  const l = (golpes.get(ip) || []).filter((t) => ahora - t < ventanaMs);
  l.push(ahora);
  golpes.set(ip, l);
  if (golpes.size > 5000) for (const [k, v] of golpes) if (!v.some((t) => ahora - t < ventanaMs)) golpes.delete(k);
  return l.length <= max;
}

@Controller('publico')
export class PublicoController {
  constructor(private s: EncuestasService) {}

  @Get(':slug') ver(@Param('slug') slug: string) { return this.s.publica(slug); }

  @Post(':slug/responder')
  @HttpCode(201)
  responder(@Param('slug') slug: string, @Body() b: any, @Req() r: any) {
    if (!limitar(r.ip)) throw new HttpException('Demasiados envíos, intenta en un minuto', 429);
    return this.s.responder(slug, b);
  }
}
