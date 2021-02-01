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

    public async save(entity: T): Promise<boolean>{
        try{
            await this.repo.save(entity);
            return true;
        } catch(error){
            console.log(error);
            return false;
        }
    }

    public async get(filter: Object): Promise< any | undefined > {
        try {
            // e.g filter = { ukey: '123-key};
            return await this.repo.findOne(filter);
        } catch (error) {
            console.log(error);
            return undefined
        }
    }
}