import { MongoClient, ObjectId } from 'mongodb';
import { AutorModel, BookModel } from "./types.ts";
import { fromModeltoAutor, fromModelToBook } from "./utils.ts";
const MONGO_URL = Deno.env.get("MONGO_URL");
if(!MONGO_URL){
  console.error("Mongo URL not found")
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();

const db = client.db("Parcial");
const booksCollection = db.collection<BookModel>("books");
const autoresCollection = db.collection<AutorModel>("autores");

const handler = async (req: Request): Promise<Response> =>{
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if(method === "GET"){
    if(path === "/libros"){
      const titulo = url.searchParams.get("titulo");
      const id = url.searchParams.get("id");
      if(titulo){
        const librosDB = await booksCollection.find({titulo:titulo}).toArray();
        const libros = await Promise.all(librosDB.map((u)=> fromModelToBook(u, autoresCollection)));
        if(libros.length === 0){
          return new Response("error : No se encontraron libros con ese título.",{status:404})
        }
        return new Response(JSON.stringify(libros), {status: 200});
      }else if(id){
        const librosDB = await booksCollection.find({_id:new ObjectId(id)}).toArray();
        const libros = await Promise.all(librosDB.map((u)=> fromModelToBook(u, autoresCollection)));
        if(libros.length === 0){
          return new Response("error : Libro no encontrado.",{status:404})
        }
        return new Response(JSON.stringify(libros), {status: 200});
      }else{
        const librosDB = await booksCollection.find().toArray();
        const libros = await Promise.all(librosDB.map((u)=> fromModelToBook(u, autoresCollection)));
        return new Response(JSON.stringify(libros));
      }
    }

  }else if(method === "POST"){
    if(path === "/libro"){
      const payload = await req.json();
      if(!payload.titulo || !payload.autores || !payload.copiasDisponibles){
        return new Response("error: El título, las copias y los autores son campos requeridos.", {status:400});
      }
      //Paso los ID del JSON de string a ObjectId para luego buscarlos en la db
      const autoresId:ObjectId[] = payload.autores.map((u:string)=> new ObjectId(u));
      const autores = await autoresCollection.find({_id:{$in:autoresId}}).toArray();

      if(autores.length !== payload.autores.length){
        return new Response("error : El autor no existe", {status:400});
      }
      const { insertedId} = await booksCollection.insertOne({
        titulo:payload.titulo,
        autores:autoresId,
        copias: payload.copiasDisponibles,
      });
      return new Response(JSON.stringify({
        message:"Libro creado existosamente",
        titulo:payload.titulo,
        autores:autores.map((u)=> fromModeltoAutor(u)),
        copias: payload.copiasDisponibles,
        id: insertedId,
      }),{status:201});
    }else if(path === "/autor"){
      const payload = await req.json();
      if(!payload.nombre || !payload.biografia){
        return new Response("error: El nombre del autor y la biografía son campos requeridos.", {status:400});
      }
      const { insertedId} = await autoresCollection.insertOne({
        nombre:payload.nombre,
        biografia:payload.biografia,
      });
      return new Response(JSON.stringify({
        message:"Autor creado existosamente",
        autor:{id: insertedId,
          nombre:payload.nombre,
          biografia:payload.biografia,}}),
        {status:201});
    }
  }else if(method === "PUT"){
    if(path === "/libro"){
      const payload = await req.json();
      if(!payload.id || !payload.titulo || !payload.autores || !payload.copiasDisponibles){
        return new Response("error : Faltan campos",{status:400});
      }
      //Paso los ID del JSON de string a ObjectId para luego buscarlos en la db
      const autoresId:ObjectId[] = payload.autores.map((u:string)=> new ObjectId(u));
      const autores = await autoresCollection.find({_id:{$in:autoresId}}).toArray();

      if(autores.length !== payload.autores.length){
        return new Response("error : El autor no existe", {status:400});
      }
      const libroId = await booksCollection.find({_id:new ObjectId(payload.id)}).toArray();
      if(libroId.length === 0){
        return new Response("error : El Id del libro no existe", {status:400});
      }
      await booksCollection.updateOne({
        _id:new ObjectId(payload.id)
      },{$set:{titulo:payload.titulo,autores:autoresId,copias:payload.copiasDisponibles}});

      return new Response(JSON.stringify({
        message:"Libro actualizado existosamente",
        libro:{id: payload.id,
          titulo:payload.titulo,
          autores:autores.map((u)=>fromModeltoAutor(u))}}),
        {status:200});
    }
  }else if(method === "DELETE"){
    if(path === "/libro"){
      const payload = await req.json();
      if(!payload.id){
        return new Response("error : Id necesario", {status:400});
      }
      const libroId = await booksCollection.find({_id:new ObjectId(payload.id)}).toArray();
      if(libroId.length === 0){
        return new Response("error : El Id del libro no existe", {status:400});
      }

      await booksCollection.deleteOne({_id: new ObjectId(payload.id)});

      return new Response(JSON.stringify({
        message: "Libro eliminado exitosamente."
      }),{status:200})
    }

  }

  return new Response("Endpoint not found", {status: 404});
}

Deno.serve({port:3000}, handler);
