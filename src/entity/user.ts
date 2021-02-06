import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { hash, compare } from 'bcryptjs';
import Database from '@auth-utils/database';
import Result from '@auth-model/result';
// import { JWT, JWTActionType } from '@auth-utils/jwt';

@Entity('users')
export default class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true, nullable: false })
  ukey: string;

  @Index({ unique: true })
  @Column({ nullable: false, length: 50, unique: true })
  email: string;

  @Column({ nullable: false, length: 100 })
  password: string;

  @Column({ nullable: false, default: false })
  confirmed: boolean;

  @Column({ name: 'refresh_index', nullable: false, default: 0 })
  refreshIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  constructor(email: string, password: string, refreshIndex: number) {
    this.id = 0;
    this.ukey = '';
    this.email = email;
    this.password = password;
    this.confirmed = false;
    this.refreshIndex = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async register(email: string, password: string, confirmation: string): Promise<Result<User>> {
    if (password != confirmation) {
      return new Result<User>(new Error('Passwords do not match'), 401);
    }

    const u = await User.getUserByEmail(email);
    if (u != undefined) {
      return new Result<User>(new Error('User already exists'), 409);
    }

    try {
      const hpass = await hash(password, 12);
      const user = new User(email, hpass, 0);
      user.ukey = uuidv4();
      if (await user.save()) return new Result<User>(user, 201);
      return new Result<User>(new Error('Registration failed'), 500);
    } catch (error) {
      return new Result<User>(new Error('Registration failed'), 500);
    }
  }

  static async login(email: string, password): Promise<Result<any>> {
    const user = await User.getUserByEmail(email);
    if (user == undefined) return new Result<any>(new Error('Invalid credentials'), 403);

    if (!user.confirmed) return new Result<any>(new Error('User not confirmed'), 401);

    try {
      const valid = await compare(password, user.password);
      return valid ? new Result(user, 200) : new Result(new Error('Invalid credentials'), 401);
    } catch (error) {
      console.log(error);
      return new Result<any>(new Error('login failed'), 500);
    }
  }

  static async getByUserKey(ukey: string, refreshIndex: number): Promise<User | undefined> {
    const db = new Database<User>(User);
    const user = await db.get({ ukey });
    return user == undefined || refreshIndex != user.refreshIndex ? undefined : user;
  }

  static async getUserByEmail(email: string): Promise<User | undefined> {
    const db = new Database<User>(User);
    return await db.get({ email });
  }

  async save(): Promise<boolean> {
    const db = new Database<User>(User);
    return await db.save(this);
  }

  async updateConfirmed(): Promise<Result<boolean>> {
    if (this.confirmed) return new Result<boolean>(new Error('User already confirmed'), 401);

    const values = { confirmed: true };
    const filter = `id = ${this.id}`;
    const db = new Database<User>(User);
    const success = db.update('users', values, filter);
    return success ? new Result(true, 200) : new Result<boolean>(new Error('Confirmed failed'), 500);
  }

  async updatePassword(oldPassword: undefined | string, newPassword: string): Promise<Result<boolean>> {
    if (oldPassword != undefined && oldPassword == newPassword) return new Result<boolean>(new Error('Password has not changed'), 400);
    const hpass = await hash(newPassword, 12);
    const values = { password: hpass };
    const filter = `id = ${this.id}`;
    const db = new Database<User>(User);
    const success = db.update('users', values, filter);

    return success ? new Result(true, 200) : new Result<boolean>(new Error('Password change failed'), 500);
  }

  async updateRefreshIndex(): Promise<Result<boolean>> {
    const values = { refreshIndex: () => 'refresh_index + 1' };
    const filter = `id = ${this.id}`;
    const db = new Database<User>(User);
    const success = db.update('users', values, filter);

    return success ? new Result(true, 200) : new Result<boolean>(new Error('Refresh increment failed'), 500);
  }
}
