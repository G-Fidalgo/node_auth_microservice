/**
 * Is a model that we use to communicate there an action pass or fails
 */

/**
 * Data: Is the result value, in case of success data is type T in case of failure data is an Error object
 * Status: Is the HTTP status assinged to the result 
 */
export default class Result<T> {
    data: T | Error;
    status: number;

    constructor(data: T | Error, status: number){
        this.data = data;
        this.status = status;
    }

    /**
     * (instanceof) checks if an Object in its chain contains property prototype of a constuctor
     * color1=new String("verde")
     * color1 instanceof String // devuelve verdadero (true)
     * color2="coral"
     * color2 instanceof String // devuelve falso (color2 no es un objeto String)
     */
    public isError() {
        return this.data instanceof Error;
    }

    /**
     * if isError is true, we return the data as an Error object otherwise we return undefined
     */
    public getError() {
        return this.isError() ? this.data as Error : undefined
    }

    /**
     * if isError is true, we return undefined otherwise we return data as an Object of type T
     */
    public getObject() {
        return this.isError() ? undefined : this.data as T;
    }
}