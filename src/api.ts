export interface Api {
    sayHello(): void
}


export function start(): Api {
    return {
        sayHello: () => console.log("hello")
    }
}