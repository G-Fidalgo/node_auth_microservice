/**
 * Data Base Model, convinient methods to store and access information on DB
 */
import { getManager, Repository, ObjectType } from 'typeorm';

export default class Databse<T> {
  repo: Repository<T>;

  /**
   * takes the entityClass of type T, to create the repository we are going to work with in the Database Instance
   * @param entityClass
   */
  constructor(entityClass: ObjectType<T>) {
    this.repo = getManager().getRepository(entityClass);
  }

  public async save(entity: T): Promise<boolean> {
    try {
      await this.repo.save(entity);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  public async update(table: string, values: object, filter: string): Promise<boolean> {
    try {
      const result = await this.repo.createQueryBuilder(table).update().set(values).where(filter).execute();
      return result.affected != undefined && result.affected > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  public async get(filter: Object): Promise<T | undefined> {
    try {
      return await this.repo.findOne(filter);
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  public async all(): Promise<T[] | undefined> {
    try {
      const rows = await this.repo.find();
      return rows;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }
}
