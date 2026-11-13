import { Injectable, Logger } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { COLUMNAS_MATRIZ, ETIQUETAS_NIVEL, claveComentario, esSeccion } from './encuestas.logic';

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';
export const ETIQUETA_GMAIL = 'Encuestas Vilaseca';

export const MENSAJE_CLIENTE_DEFECTO = 'Hola {nombre},\n\nGracias por haber llenado la encuesta «{encuesta}». Tu opinión es muy valiosa y nos ayuda a mejorar cada día.';
export const ASUNTO_CLIENTE_DEFECTO = 'Gracias por responder nuestra encuesta';

const MAPA: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v: any) => String(v ?? '').replace(/[&<>"']/g, (c) => MAPA[c]);
const sinSaltos = (v: any) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim();

/**
 * Envia correos con la API de Gmail (mismo esquema OAuth2 que backend-lici).
 * Variables: GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET (o GOOGLE_*), GMAIL_REFRESH_TOKEN
 * (o GMAIL_TOKEN_FILE apuntando a un token.json con refresh_token), SENDER_ALIAS, SENDER_NAME.
 */
@Injectable()
export class CorreoService {
  private log = new Logger('Correo');
  private cliente: OAuth2Client | null | undefined;
  private etiquetaId: string | null = null;

  private auth(): OAuth2Client | null {
    if (this.cliente !== undefined) return this.cliente;
    const id = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const secreto = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    let refresh = process.env.GMAIL_REFRESH_TOKEN;
    const archivo = process.env.GMAIL_TOKEN_FILE || join(process.cwd(), 'credentials', 'token.json');
    let token: any = {};
    if (archivo && existsSync(archivo)) {
      try {
        token = JSON.parse(readFileSync(archivo, 'utf-8'));
        refresh = refresh || token.refresh_token;
      } catch (e: any) {
        this.log.error(`No se pudo leer GMAIL_TOKEN_FILE: ${e.message}`);
      }
    }
    if (!id || !secreto || !refresh) {
      this.log.warn('Gmail no configurado (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN): no se enviarán correos.');
      return (this.cliente = null);
    }
    const c = new OAuth2Client(id, secreto);
    c.setCredentials({ refresh_token: refresh, access_token: token.access_token, expiry_date: token.expiry_date });
    return (this.cliente = c);
  }

  private async asegurarEtiqueta(c: OAuth2Client): Promise<string | null> {
    if (this.etiquetaId) return this.etiquetaId;
    try {
      const lista: any = await c.request({ url: `${GMAIL}/labels` });
      const ex = (lista.data.labels || []).find((l: any) => l.name === ETIQUETA_GMAIL);
      if (ex) return (this.etiquetaId = ex.id);
      const nueva: any = await c.request({
        url: `${GMAIL}/labels`, method: 'POST',
        data: { name: ETIQUETA_GMAIL, labelListVisibility: 'labelShow', messageListVisibility: 'show' },
      });
      return (this.etiquetaId = nueva.data.id);
    } catch (e: any) {
      this.log.error(`No se pudo asegurar la etiqueta ${ETIQUETA_GMAIL}: ${e.message}`);
      return null;
    }
  }

  async enviar(para: string, asunto: string, html: string): Promise<boolean> {
    const c = this.auth();
    if (!c) return false;
    try {
      const alias = process.env.SENDER_ALIAS;
      const nombre = sinSaltos(process.env.SENDER_NAME || 'CaliTori').replace(/"/g, '');
      const mensaje = [
        ...(alias ? [`From: "${nombre}" <${alias}>`] : []),
        `To: ${sinSaltos(para)}`,
        `Subject: =?utf-8?B?${Buffer.from(sinSaltos(asunto)).toString('base64')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        (Buffer.from(html).toString('base64').match(/.{1,76}/g) || []).join('\r\n'),
      ].join('\r\n');
      const raw = Buffer.from(mensaje).toString('base64url');
      const res: any = await c.request({ url: `${GMAIL}/messages/send`, method: 'POST', data: { raw } });
      const etiqueta = await this.asegurarEtiqueta(c);
      if (etiqueta && res.data?.id) {
        await c.request({ url: `${GMAIL}/messages/${res.data.id}/modify`, method: 'POST', data: { addLabelIds: [etiqueta] } })
          .catch((e: any) => this.log.error(`No se pudo etiquetar el mensaje: ${e.message}`));
      }
      return true;
    } catch (e: any) {
      this.log.error(`Error enviando correo a ${para}: ${e.message}`);
      return false;
    }
  }

  // ---------- contenido ----------
  private marco(titulo: string, cuerpo: string) {
    return `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
<div style="background:#2563eb;padding:18px 22px"><h2 style="color:#fff;margin:0;font-size:18px">${esc(titulo)}</h2></div>
<div style="padding:24px;background:#fff;color:#334155;font-size:14px;line-height:1.55">${cuerpo}
<p style="font-size:11px;color:#94a3b8;text-align:center;margin:26px 0 0;border-top:1px solid #e2e8f0;padding-top:12px">Mensaje automático por Agencia Vilaseca. Por favor no respondas a este correo.</p></div></div>`;
  }

  private formatear(q: any, v: any): string {
    if (v === undefined || v === null || v === '') return '<i style="color:#94a3b8">Sin respuesta</i>';
    switch (q.tipo) {
      case 'escala': return `${esc(v)} / 10`;
      case 'caritas': return esc(ETIQUETAS_NIVEL[[2, 4, 6, 8, 10].indexOf(Number(v))] || v);
      case 'estrellas': return `${'★'.repeat(Number(v) / 2)}${'☆'.repeat(5 - Number(v) / 2)} (${Number(v) / 2} de 5)`;
      case 'multiple': return esc((v as string[]).join(', '));
      case 'matriz':
        return (q.filas || []).map((f: string) => {
          const k = COLUMNAS_MATRIZ.findIndex((c) => c.valor === v[f]);
          return `${esc(f)}: <b>${k < 0 ? '—' : esc(q.columnas?.[k] || COLUMNAS_MATRIZ[k].etiqueta)}</b>`;
        }).join('<br>');
      default: return esc(v).replace(/\n/g, '<br>');
    }
  }

  htmlAdmin(enc: { titulo: string; preguntas: any[]; camposCliente: any[] }, datos: any, total: number) {
    const fecha = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz', hour12: false });
    const quien = enc.camposCliente
      .filter((c) => datos.respondiente?.[c.id])
      .map((c) => `<tr><td style="padding:3px 12px 3px 0;color:#64748b">${esc(c.etiqueta)}</td><td><b>${esc(datos.respondiente[c.id])}</b></td></tr>`)
      .join('');
    const filas = enc.preguntas.filter((q) => !esSeccion(q)).map((q, i) => {
      const com = datos.respuestas?.[claveComentario(q.id)];
      return `<tr><td style="padding:10px 0;border-top:1px solid #e2e8f0"><div style="color:#64748b;font-size:12px">Pregunta ${i + 1}</div>
<div style="font-weight:bold;color:#0f172a">${esc(q.texto)}</div><div style="margin-top:4px">${this.formatear(q, datos.respuestas?.[q.id])}</div>
${com ? `<div style="margin-top:4px;color:#475569"><i>Comentario:</i> ${esc(com)}</div>` : ''}</td></tr>`;
    }).join('');
    return this.marco('Nueva respuesta recibida', `
<p>Se registró una nueva respuesta en <b>${esc(enc.titulo)}</b> (${esc(fecha)}). Total de respuestas: <b>${total}</b>.</p>
${quien ? `<table style="background:#f8fafc;border-left:4px solid #2563eb;padding:10px 14px;margin:14px 0;width:100%">${quien}</table>` : '<p style="color:#64748b"><i>Respuesta anónima.</i></p>'}
<table style="width:100%;border-collapse:collapse">${filas}</table>`);
  }

  /**
   * El mensaje es el cuerpo completo del correo (el saludo va dentro del mensaje).
   * Se reemplazan {encuesta} y {Etiqueta} de cualquier dato que el cliente llenó (ej. {Nombre}).
   */
  htmlCliente(mensaje: string, titulo: string, campos: any[], valores: Record<string, string>) {
    const valorDe = (nombre: string) => {
      const n = nombre.trim().toLowerCase();
      if (n === 'encuesta') return titulo;
      const c = campos.find((x) => String(x.etiqueta).trim().toLowerCase() === n) || (n === 'nombre' ? campos.find((x) => /nombre/i.test(x.etiqueta)) : undefined);
      return c ? String(valores?.[c.id] ?? '').trim() : null;
    };
    const texto = (mensaje || MENSAJE_CLIENTE_DEFECTO)
      .replace(/\{([^{}]{1,60})\}/g, (m, n: string) => valorDe(n) ?? m)
      .replace(/[ \t]+([,.!?;:])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ');
    return this.marco(titulo, `<p style="font-size:15px">${esc(texto).replace(/\n/g, '<br>')}</p>`);
  }
}
