/**
 * Class that manage all the type of acces that are allowed on our application
 */
import 'reflect-metadata';
import { sign, verify } from 'jsonwebtoken';
import Database from '@auth-utils/database';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

const accessIds: number[] = [];
const accessNames: string[] = [];
const accessItems: Access[] = [];

@Entity()
export default class Access {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: false })
  duration: number;

  @Column({ name: 'duration_unit', nullable: false })
  durationUnit: string;

  @Column({ nullable: false, unique: true })
  signature: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor() {
    this.id = 0;
    this.name = '';
    this.duration = 0;
    this.durationUnit = 'm';
    this.signature = '';
    this.createdAt = new Date();
  }

  // Call when we are creating our server, and it is going to load all the rows within our access table
  static async load(): Promise<void> {
    if (accessItems.length > 0) return;

    const d = new Database<Access>(Access);
    const a = await d.all();

    if (a == undefined) return;

    a.forEach((x) => {
      accessIds.push(x.id);
      accessNames.push(x.name);
      accessItems.push(x);
    });
  }

  static encode(ukey: string, refreshIndex: number, accessName: string): string | undefined {
    if (!accessNames.includes(accessName)) throw new Error(`Access name "${accessName}" is not defined in the database`);

    const position = accessNames.indexOf(accessName);
    const accessId = accessIds[position];
    const accessItem = accessItems[position];

    try {
      const claims = {
        iss: process.env.JWT_ISSUER,
        uky: ukey,
        act: accessId,
        rti: refreshIndex
      };
      const token = sign(claims, accessItem.signature, { expiresIn: accessItem.expiresIn() });
      return token;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  static decode(token: string, accessId: number): any | undefined {
    if (!accessIds.includes(accessId)) return undefined;

    const position = accessIds.indexOf(accessId);
    const accessItem = accessItems[position];

    try {
      const claims = verify(token, accessItem.signature);
      return claims;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  static refreshExpiration(): Date {
    if (!accessNames.includes(process.env.ACCESS_TYPE_REFRESH!)) throw new Error('ACCESS_TYPE_REFRESH name not defined in database');
    const position = accessNames.indexOf(process.env.ACCESS_TYPE_REFRESH!);
    const accessItem = accessItems[position];
    const d = new Date();
    d.setDate(d.getDate() + accessItem.duration);
    return d;
  }

  static idFromName(name: string): number {
    if (!accessNames.includes(name)) throw new Error(`Access name "${name}" not defined in database`);
    const position = accessNames.indexOf(name);
    return accessIds[position];
  }

  expiresIn(): string {
    return `${this.duration}${this.durationUnit}`;
  }
}
