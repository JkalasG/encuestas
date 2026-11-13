import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { Registro } from '../registro.entity';
import { ASUNTO_CLIENTE_DEFECTO, CorreoService } from './correo.service';
import {
  calcularResumen, claveComentario, normalizarSlug, sanitizarEncuesta, slugAleatorio, slugValido, validarRespuesta,
} from './encuestas.logic';

@Injectable()
export class EncuestasService {
  constructor(@InjectRepository(Registro) private repo: Repository<Registro>, private correo: CorreoService) { }

  // ---------- helpers ----------
  private async propia(id: string, usuarioId: string) {
    const e = await this.repo.findOne({ where: { id, tipo: 'encuesta' } });
    if (!e) throw new NotFoundException('Encuesta no encontrada');
    if (e.padreId !== usuarioId) throw new ForbiddenException();
    return e;
  }
  private async resolverSlug(pedido: any, actualId?: string) {
    let slug = normalizarSlug(pedido);
    if (!slug) {
      do slug = slugAleatorio();
      while (await this.repo.findOne({ where: { llave: slug } }));
      return slug;
    }
    if (!slugValido(slug)) throw new BadRequestException('El enlace debe tener 3-40 caracteres: letras, números y guiones');
    const otro = await this.repo.findOne({ where: { llave: slug } });
    if (otro && otro.id !== actualId) throw new BadRequestException('Ese enlace ya está en uso, elige otro');
    return slug;
  }
  private vista(e: Registro, respuestas?: number) {
    return { id: e.id, slug: e.llave, titulo: e.nombre, activo: e.activo, creadoEn: e.creadoEn, ...e.datos, respuestas };
  }

  // ---------- administracion ----------
  async listar(usuarioId: string) {
    const encs = await this.repo.find({ where: { tipo: 'encuesta', padreId: usuarioId }, order: { creadoEn: 'DESC' } });
    if (!encs.length) return [];
    const cuentas = await this.repo
      .createQueryBuilder('r')
      .select('r.padreId', 'id')
      .addSelect('COUNT(*)', 'n')
      .where('r.tipo = :t', { t: 'respuesta' })
      .andWhere('r.padreId IN (:...ids)', { ids: encs.map((e) => e.id) })
      .groupBy('r.padreId')
      .getRawMany();
    const m = Object.fromEntries(cuentas.map((c) => [c.id, Number(c.n)]));
    return encs.map((e) => this.vista(e, m[e.id] || 0));
  }

  async obtener(id: string, usuarioId: string) {
    const e = await this.propia(id, usuarioId);
    const n = await this.repo.count({ where: { tipo: 'respuesta', padreId: id } });
    return this.vista(e, n);
  }

  async crear(usuarioId: string, body: any) {
    const { titulo, datos } = sanitizarEncuesta(body);
    const slug = await this.resolverSlug(body?.slug);
    const e = await this.repo.save(this.repo.create({ tipo: 'encuesta', padreId: usuarioId, llave: slug, nombre: titulo, datos, activo: true }));
    return this.vista(e, 0);
  }

  async actualizar(id: string, usuarioId: string, body: any) {
    const e = await this.propia(id, usuarioId);
    const { titulo, datos } = sanitizarEncuesta(body);
    e.llave = await this.resolverSlug(body?.slug ?? e.llave, e.id);
    e.nombre = titulo;
    e.datos = datos;
    if (typeof body?.activo === 'boolean') e.activo = body.activo;
    await this.repo.save(e);
    return this.vista(e);
  }

  async cambiarEstado(id: string, usuarioId: string, activo: boolean) {
    const e = await this.propia(id, usuarioId);
    e.activo = !!activo;
    await this.repo.save(e);
    return { ok: true, activo: e.activo };
  }

  async eliminar(id: string, usuarioId: string) {
    await this.propia(id, usuarioId);
    await this.repo.delete({ tipo: 'respuesta', padreId: id });
    await this.repo.delete({ id });
    return { ok: true };
  }

  // ---------- respuestas (panel) ----------
  async respuestas(id: string, usuarioId: string) {
    const e = await this.propia(id, usuarioId);
    const filas = await this.repo.find({ where: { tipo: 'respuesta', padreId: id }, order: { creadoEn: 'DESC' } });
    return {
      encuesta: this.vista(e, filas.length),
      respuestas: filas.map((f) => ({ id: f.id, creadoEn: f.creadoEn, ...f.datos })),
    };
  }

  async resumen(id: string, usuarioId: string) {
    const e = await this.propia(id, usuarioId);
    const filas = await this.repo.find({ where: { tipo: 'respuesta', padreId: id }, select: { id: true, datos: true, creadoEn: true } });
    return { total: filas.length, preguntas: calcularResumen(e.datos, filas) };
  }

  async eliminarRespuesta(respId: string, usuarioId: string) {
    const r = await this.repo.findOne({ where: { id: respId, tipo: 'respuesta' } });
    if (!r) throw new NotFoundException();
    await this.propia(r.padreId, usuarioId);
    await this.repo.delete({ id: respId });
    return { ok: true };
  }

  async exportar(id: string, usuarioId: string) {
    const e = await this.propia(id, usuarioId);
    const filas = await this.repo.find({ where: { tipo: 'respuesta', padreId: id }, order: { creadoEn: 'ASC' } });
    const d = e.datos;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Encuestas';

    const ws = wb.addWorksheet('Respuestas');
    const cols: { header: string; key: string; width: number }[] = [
      { header: '#', key: 'n', width: 6 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      ...d.camposCliente.map((c: any) => ({ header: c.etiqueta, key: 'c_' + c.id, width: 22 })),
    ];
    for (const q of d.preguntas.filter((x: any) => x.tipo !== 'seccion')) {
      if (q.tipo === 'matriz') q.filas.forEach((f: string, i: number) => cols.push({ header: `${q.texto} -${f}`, key: `q_${q.id}_${i}`, width: 24 }));
      else {
        cols.push({ header: q.texto, key: 'q_' + q.id, width: 26 });
        if (q.seguimiento && Object.values<any>(q.seguimiento).some((s) => s.comentario))
          cols.push({ header: `${q.texto} -comentario`, key: 'c_' + q.id + '_com', width: 36 });
      }
    }
    ws.columns = cols;
    filas.forEach((f, i) => {
      const row: any = { n: i + 1, fecha: f.creadoEn };
      for (const c of d.camposCliente) row['c_' + c.id] = f.datos?.respondiente?.[c.id] ?? '';
      for (const q of d.preguntas.filter((x: any) => x.tipo !== 'seccion')) {
        const v = f.datos?.respuestas?.[q.id];
        if (q.tipo === 'matriz') q.filas.forEach((fila: string, i2: number) => (row[`q_${q.id}_${i2}`] = v?.[fila] ?? ''));
        else {
          row['q_' + q.id] = Array.isArray(v) ? v.join(', ') : v ?? '';
          row['c_' + q.id + '_com'] = f.datos?.respuestas?.[claveComentario(q.id)] ?? '';
        }
      }
      ws.addRow(row);
    });
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    ws.getColumn('fecha').numFmt = 'dd/mm/yyyy hh:mm';
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    const wr = wb.addWorksheet('Resumen');
    wr.columns = [
      { header: 'Pregunta', key: 'p', width: 50 },
      { header: 'Tipo', key: 't', width: 16 },
      { header: 'Respuestas', key: 'n', width: 12 },
      { header: 'Promedio (1-10)', key: 'a', width: 16 },
    ];
    for (const r of calcularResumen(d, filas)) {
      if (r.tipo === 'matriz') r.filas.forEach((f: any) => wr.addRow({ p: `${r.texto} -${f.fila}`, t: r.tipo, n: f.total, a: f.promedio }));
      else wr.addRow({ p: r.texto, t: r.tipo, n: r.total, a: r.promedio ?? '' });
    }
    wr.getRow(1).font = { bold: true };

    return { buffer: Buffer.from(await wb.xlsx.writeBuffer()), nombre: `${e.llave}.xlsx` };
  }

  // ---------- publico ----------
  private estado(e: Registro, total: number) {
    if (!e.activo) return 'pausada';
    if (e.datos.fechaLimite && new Date(e.datos.fechaLimite) < new Date()) return 'vencida';
    if (e.datos.maxRespuestas && total >= e.datos.maxRespuestas) return 'completa';
    return 'abierta';
  }

  async publica(slug: string) {
    const e = await this.repo.findOne({ where: { tipo: 'encuesta', llave: String(slug).toLowerCase() } });
    if (!e) throw new NotFoundException('Esta encuesta no existe');
    const total = e.datos.maxRespuestas ? await this.repo.count({ where: { tipo: 'respuesta', padreId: e.id } }) : 0;
    const { titulo, descripcion, mensajeFinal, preguntas, camposCliente, fechaLimite, tema } = { titulo: e.nombre, ...e.datos };
    return { titulo, descripcion, mensajeFinal, preguntas, camposCliente, fechaLimite, tema, estado: this.estado(e, total) };
  }

  async responder(slug: string, body: any) {
    const e = await this.repo.findOne({ where: { tipo: 'encuesta', llave: String(slug).toLowerCase() } });
    if (!e) throw new NotFoundException('Esta encuesta no existe');
    const total = await this.repo.count({ where: { tipo: 'respuesta', padreId: e.id } });
    const est = this.estado(e, total);
    if (est !== 'abierta') throw new BadRequestException('Esta encuesta ya no recibe respuestas');
    const datos = validarRespuesta(e.datos, body);
    await this.repo.save(this.repo.create({ tipo: 'respuesta', padreId: e.id, datos, activo: true }));
    this.notificar(e, datos, total + 1).catch(() => undefined); // no retrasa ni rompe la respuesta
    return { ok: true, mensaje: e.datos.mensajeFinal };
  }

  /** Correo al administrador y/o confirmacion al cliente, segun la configuracion de la encuesta. */
  private async notificar(e: Registro, datos: any, total: number) {
    const cfg = e.datos.configuracion || {};
    if (!cfg.avisarAdmin && !cfg.confirmarCliente) return;
    const enc = { titulo: e.nombre, preguntas: e.datos.preguntas, camposCliente: e.datos.camposCliente };

    if (cfg.avisarAdmin) {
      const admin = await this.repo.findOne({ where: { id: e.padreId, tipo: 'usuario' } });
      if (admin?.llave) await this.correo.enviar(admin.llave, `Nueva respuesta: ${e.nombre}`, this.correo.htmlAdmin(enc, datos, total));
    }
    if (cfg.confirmarCliente) {
      const campos: any[] = e.datos.camposCliente || [];
      const campo = campos.find((c) => c.id === cfg.campoCorreoId) || campos.find((c) => c.tipo === 'email');
      const destino = campo && datos.respondiente?.[campo.id];
      if (destino) {
        await this.correo.enviar(destino, cfg.asuntoCliente || ASUNTO_CLIENTE_DEFECTO, this.correo.htmlCliente(cfg.mensajeCliente, e.nombre, campos, datos.respondiente || {}));
      }
    }
  }
}
