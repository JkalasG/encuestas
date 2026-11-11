import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { sanitizarEncuesta } from './encuestas/encuestas.logic';
import { Registro } from './registro.entity';

/** Primer arranque (base sin usuarios): crea un admin y una encuesta de ejemplo. */
@Injectable()
export class Seed implements OnModuleInit {
  private log = new Logger('Seed');
  constructor(@InjectRepository(Registro) private repo: Repository<Registro>) {}

  async onModuleInit() {
    const email = (process.env.ADMIN_EMAIL || 'sgc@agencia-vilaseca.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'EPSIUQzurc.97';

    // Si existía el usuario por defecto antiguo (admin@encuestas.com) y no existe el nuevo, lo actualizamos
    const existenteNuevo = await this.repo.findOne({ where: { tipo: 'usuario', llave: email } });
    if (!existenteNuevo) {
      const antiguo = await this.repo.findOne({ where: { tipo: 'usuario', llave: 'admin@encuestas.com' } });
      if (antiguo) {
        antiguo.llave = email;
        antiguo.clave = await bcrypt.hash(password, 10);
        await this.repo.save(antiguo);
        this.log.log(`Cuenta administradora actualizada a: ${email}`);
        return;
      }
    }

    if (await this.repo.count({ where: { tipo: 'usuario' } })) return;

    const admin = await this.repo.save(
      this.repo.create({ tipo: 'usuario', llave: email, nombre: 'Administrador', clave: await bcrypt.hash(password, 10), datos: { proveedor: 'local' } }),
    );

    const { titulo, datos } = sanitizarEncuesta({
      titulo: 'Encuesta de satisfacción del cliente',
      descripcion: 'Tu opinión nos ayuda a mejorar. Toma menos de un minuto.',
      camposCliente: [{ etiqueta: 'Nombre', obligatorio: false }, { etiqueta: 'Empresa', obligatorio: false }],
      preguntas: [
        { tipo: 'matriz', texto: '¿Qué tan satisfecho estás con…?', obligatoria: true, filas: ['Atención al cliente', 'Ambiente de la tienda', 'Variedad de productos', 'Ubicación'] },
        { tipo: 'escala', texto: '¿Qué tan probable es que recomiendes nuestra tienda a un amigo?', obligatoria: true },
        { tipo: 'caritas', texto: '¿Cuál es tu sensación general sobre la tienda?', obligatoria: true, seguimiento: { '2': { mensaje: 'Lamentamos eso. ¿Qué podemos mejorar?', comentario: true }, '4': { mensaje: '¿Qué podemos mejorar?', comentario: true }, '10': { mensaje: '¡Excelente! Seguiremos trabajando para no defraudarte.', comentario: false } } },
        { tipo: 'estrellas', texto: 'Califica tu última compra' },
        { tipo: 'multiple', texto: '¿Qué te gustaría que mejoremos?', opciones: ['Precios', 'Rapidez', 'Variedad', 'Atención'] },
        { tipo: 'texto', texto: '¿Tienes sugerencias que nos ayuden a mejorar?' },
      ],
    });
    await this.repo.save(this.repo.create({ tipo: 'encuesta', padreId: admin.id, llave: 'ejemplo', nombre: titulo, datos, activo: true }));

    this.log.log(`Usuario inicial: ${email} / ${password}  (cámbialos con ADMIN_EMAIL y ADMIN_PASSWORD en .env antes del primer arranque)`);
    this.log.log('Encuesta de ejemplo en /s/ejemplo');
  }
}
