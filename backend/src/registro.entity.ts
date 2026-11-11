import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type TipoRegistro = 'usuario' | 'encuesta' | 'respuesta';

/**
 * Tabla unica del sistema (por ahora).
 *  - usuario  : llave = correo, nombre, clave (hash), datos = {proveedor}
 *  - encuesta : llave = slug del enlace, padreId = id del usuario, nombre = titulo, datos = configuracion
 *  - respuesta: padreId = id de la encuesta, datos = {respondiente, respuestas}
 */
@Entity('registros')
@Index(['tipo', 'padreId'])
export class Registro {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tipo: TipoRegistro;
  @Column({ nullable: true }) padreId: string;
  @Index({ unique: true }) @Column({ nullable: true }) llave: string;
  @Column({ nullable: true }) nombre: string;
  @Column({ nullable: true }) clave: string;
  @Column({ default: true }) activo: boolean;
  @Column('simple-json', { nullable: true }) datos: any;
  @CreateDateColumn() creadoEn: Date;
}
