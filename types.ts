import {ObjectId, OptionalId} from 'mongodb';

export type BookModel = OptionalId<{
    titulo: string,
    autores: ObjectId[],
    copias: number,
}>

export type AutorModel = OptionalId<{
    nombre: string,
    biografia: string,
}>
export type Autor = {
    id: string,
    nombre: string,
    biografia: string,
}

export type Book = {
    id: string,
    titulo: string,
    autores: Autor[],
    copias: number,
}