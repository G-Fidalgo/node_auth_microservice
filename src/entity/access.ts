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
    this.durationUnit = '';
    this.signature = '';
    this.createdAt = new Date();
  }

  // Call when we are creating our server, and it is going to load all the rows within our access table
  static async load() {
    if (accessItems.length > 0) return;

    const d = new Database<Access>(Access);
    const rows = await d.all();

    rows?.forEach((x) => {
      accessIds.push(x.id);
      accessNames.push(x.name);
      accessItems.push(x);
    });
  }

  static encode(ukey: string, refreshIndex: number, accessName: string): string | undefined {
    if (!accessNames.includes(accessName)) return undefined;

    const position = accessNames.indexOf(accessName);
    const accessItem = accessItems[position];
    try {
      const claims = {
        iss: process.env.JWT_ISSUER,
        uky: ukey,
        act: accessItem.id,
        rti: refreshIndex
      };

      const token = sign(claims, accessItem.signature, { expiresIn: accessItem.expiresIn() });
      return token;
    } catch (error) {
      console.log(error);
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
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  static refreshExpiration() {
    if (!accessNames.includes(process.env.ACCESS_TYPE_REFRESH!))
      throw new Error(`Access name ${process.env.ACCESS_TYPE_REFRESH!} is not in database`);

    const position = accessNames.indexOf(process.env.ACCESS_TYPE_REFRESH!);
    const accessItem = accessItems[position];

    const d = new Date();
    d.setDate(d.getDate() + accessItem.duration);
    return d;
  }

  static idFromName(name: string): number {
    if (!accessNames.includes(name)) throw new Error(`Access name ${name} is not in Database`);

    const position = accessNames.indexOf(name);
    return accessIds[position];
  }

  expiresIn() {
    return `${this.duration}${this.durationUnit}`;
  }
}
