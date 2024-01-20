export class ArgvMap extends Map<string,string|null> {
    constructor(){
        super();
    }
    hasAll(...keys:string[]){
        for (const key of keys){
            if (!this.has(key)) {
                return false;
            }
        }
        return true; 
    }
    hasAny(...keys:string[]){
        for (const key of keys){
            if (!this.has(key)) {
                return true;
            }
        }
        return false;
    }
}