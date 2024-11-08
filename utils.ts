import { AutorModel, BookModel, Autor, Book } from "./types.ts";
import { Collection } from 'mongodb';
export const fromModelToBook = async ( model:BookModel, autoresCollection:Collection<AutorModel>):Promise<Book>=>{
    const autores = await autoresCollection.find({_id:{$in:model.autores}}).toArray();

    return{
        id: model._id!.toString(),
        titulo: model.titulo,
        autores: autores.map((u)=>fromModeltoAutor(u)),
        copias: model.copias,
    }
}

export const fromModeltoAutor = (model:AutorModel):Autor=>{
    return{
        id: model._id!.toString(),
        nombre: model.nombre,
        biografia: model.biografia,
    }   }