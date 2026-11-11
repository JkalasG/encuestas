import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { Registro } from '../registro.entity';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class AuthService {
  private google = new OAuth2Client();
  constructor(@InjectRepository(Registro) private repo: Repository<Registro>, private jwt: JwtService) {}

  private emitir(u: Registro) {
    return {
      token: this.jwt.sign({ sub: u.id, nombre: u.nombre }),
      usuario: { id: u.id, nombre: u.nombre, email: u.llave },
    };
  }

  async crearUsuarioAdmin(nombre: string, email: string, password: string) {
    email = String(email || '').trim().toLowerCase();
    nombre = String(nombre || '').trim().slice(0, 80);
    if (!nombre) throw new BadRequestException('Escribe el nombre del usuario');
    if (!EMAIL.test(email)) throw new BadRequestException('Correo inválido');
    if (String(password || '').length < 6) throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    if (await this.repo.findOne({ where: { tipo: 'usuario', llave: email } }))
      throw new BadRequestException('Ese correo ya está registrado');
    const u = await this.repo.save(
      this.repo.create({ tipo: 'usuario', llave: email, nombre, clave: await bcrypt.hash(password, 10), datos: { proveedor: 'local' } }),
    );
    return { id: u.id, nombre: u.nombre, email: u.llave, fecha: u.creadoEn };
  }

  async listarUsuarios() {
    const lista = await this.repo.find({ where: { tipo: 'usuario' }, order: { creadoEn: 'ASC' } });
    return lista.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.llave,
      fecha: u.creadoEn,
    }));
  }

  async eliminarUsuario(id: string, solicitanteId: string) {
    if (id === solicitanteId) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta activa');
    }
    const u = await this.repo.findOne({ where: { id, tipo: 'usuario' } });
    if (!u) throw new BadRequestException('Usuario no encontrado');
    await this.repo.remove(u);
    return { ok: true };
  }

  async login(email: string, password: string) {
    const u = await this.repo.findOne({ where: { tipo: 'usuario', llave: String(email || '').trim().toLowerCase() } });
    if (!u || !u.clave || !(await bcrypt.compare(String(password || ''), u.clave)))
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    return this.emitir(u);
  }

  async loginGoogle(credential: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new BadRequestException('Google no está configurado en el servidor (GOOGLE_CLIENT_ID)');
    let payload;
    try {
      const t = await this.google.verifyIdToken({ idToken: credential, audience: clientId });
      payload = t.getPayload();
    } catch {
      throw new UnauthorizedException('Token de Google inválido');
    }
    if (!payload?.email || !payload.email_verified) throw new UnauthorizedException('Correo de Google no verificado');
    const email = payload.email.toLowerCase();
    let u = await this.repo.findOne({ where: { tipo: 'usuario', llave: email } });
    if (!u) {
      u = await this.repo.save(
        this.repo.create({ tipo: 'usuario', llave: email, nombre: payload.name || email, datos: { proveedor: 'google' } }),
      );
    }
    return this.emitir(u);
  }
}
