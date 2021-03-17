const express = require('express'); //incorporamos a la aplicación el express con una variable con una constante. Dentro de ('') van los valores de el paquete que instalamos
const mysql = require('mysql'); //lllamamos en un const en una variable mysql con el paquete mysql
const util = require('util'); //agregamos la aplicacion util que ya viene con cualqueir paquete y sirve para usar a futuro un async await
const cors= require ('cors');

const app = express(); // uso de express
const port = 3000; //podemos cambiar el puerto acá



app.use(express.json());
app.use(cors());

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
});

// EXCEPCIONES
const FALTAN_DATOS = {code: 'FALTAN_DATOS', message: 'faltan datos'};
const CATEGORIA_NO_ENCONTRADA = {code: 'CATEGORIA_NO_ENCONTRADA', message: 'no se encontro la categoria'};
const PERSONA_NO_ENCONTRADA = {code: 'PERSONA_NO_ENCONTRADA', message: 'no se enconro la persona'};
const LIBRO_NO_ENCONTRADO = {code: 'LIBRO_NO_ENCONTRADO', message: 'no se encontro el libro'};


conexion.connect((error) => {
    if (error) {
        throw error;
    }
    console.log('Conexion con la base de datos mysql establecida');
});

const qy = util.promisify(conexion.query).bind(conexion);


/* CATEGORIA */
app.get('/categoria', async(req, res) => {
    try {
        const query = 'SELECT * FROM categorias';
        const respuesta = await qy(query);
        res.status(200).json(respuesta);
    } catch (e) {
        console.log(e);
        res.status(403).send([]);
    }
});


app.get('/categoria/:id', async(req, res) => {

    try {

        const query = 'SELECT * FROM categorias WHERE id = ?';
        const respuesta = await qy(query, [req.params.id]);
        if(respuesta.length == 1){
            res.status(200).json(respuesta[0]);
        }else{
            throw CATEGORIA_NO_ENCONTRADA;
        }

    } catch (e) {
        console.log(e);
        res.status(403)
        switch(e.code){
            case 'CATEGORIA_NO_ENCONTRADA':
                res.send({mensaje: e.message});
                break;
            default:
                res.send({mensaje: 'error inesperado'});
                break;
        }
    }

});

app.post('/categoria', async(req, res) => {
    try {

        if (!req.body.nombre || !req.body.nombre.trim()) {
            throw FALTAN_DATOS;
        }
        const nombre = req.body.nombre.toUpperCase().trim();
        let query = 'SELECT id FROM categorias WHERE nombre = ?';
        let respuesta = await qy(query, [nombre]);
        if (respuesta.length > 0) {
            throw {code: 'YA_EXISTE', message: 'Esa categoría ya existe'};
        }
        query = 'INSERT INTO categorias(nombre) VALUE (?)';
        respuesta = await qy(query, [nombre]);
        const registroInsertado = await qy('SELECT * FROM categorias WHERE id=?', [respuesta.insertId]);
        res.status(200).json(registroInsertado[0]);

    } catch (e) {
        console.log(e);
        res.status(403);
        switch(e.code){
            case 'FALTAN_DATOS':
            case 'YA_EXISTE':
                res.send({mensaje: e.message});
                break;   
            default:
                res.send({mensaje: "error inesperado"});
        }
    }
});

app.delete('/categoria/:id', async(req, res) => {

    try {
        const id = req.params.id;
        let query = 'SELECT * FROM categorias WHERE id = ?'
        let registro = await qy(query, [id]);
        if(registro.length == 1){
            query = 'SELECT * FROM libros WHERE categoria_id = ?';
            registro = await qy(query, [req.params.id]);
            if(registro.length > 0){
                throw {code: 'CATEGORIA_DATOS_ASOCIADOS', message: 'categoria con datos asociados, no se puede eliminar'};
            }
            query = 'DELETE FROM categorias WHERE id = ?';
            registro = await qy(query, [req.params.id]);
            res.status(200).send({mensaje: "se borro correctamente"});
        }else{
            throw CATEGORIA_NO_ENCONTRADA;
        }
    } catch (e) {
        console.log(e);
        res.status(403);
            switch(e.code){
                case 'CATEGORIA_NO_ENCONTRADA':
                case 'CATEGORIA_DATOS_ASOCIADOS':
                    res.send({mensaje: e.message});
                    break;
                default:
                    res.send({mensaje: "error inesperado"});
            }
    }
});

/* Persona */
app.post('/persona', async(req, res) => {
    try {
        if (!req.body.nombre || !req.body.apellido || !req.body.email || !req.body.alias ||
            !req.body.nombre.trim() || !req.body.apellido.trim() || !req.body.email.trim() || !req.body.alias.trim()) {
            throw FALTAN_DATOS;
        }

        const persona = {
            nombre: req.body.nombre.trim(),
            apellido: req.body.apellido.trim(),
            email: req.body.email.trim().toUpperCase(),
            alias: req.body.alias.trim()
        }

        query = 'SELECT * FROM personass WHERE email = ?';
        respuesta = await qy(query, persona.email);
        if (respuesta.length > 0) {
            throw {code: 'EMAIL_YA_REGISTRADO', message: 'el email ya se encuentra registrado'};
        }

        query = 'INSERT INTO personas (nombre, apellido, email, alias) VALUES (?, ?, ?, ?)';
        respuesta = await qy(query, [persona.nombre, persona.apellido, persona.email, persona.alias]);
        registroInsertado = await qy('SELECT * FROM personas WHERE id = ?', [respuesta.insertId]);
        res.status(200).json(registroInsertado[0]);

    } catch (e) {
        console.error(e.message);
        res.status(403);
        switch (e.code){
            case 'FALTAN_DATOS':
            case 'EMAIL_YA_REGISTRADO':
                res.send({mensaje: 'e.message'});
                break;
            default:
                res.send({mensaje: 'error inesperado'})
        }
    }
});

app.get('/persona', async(req, res) => {
    try {
        const query = 'SELECT * FROM personass';
        const respuesta = await qy(query);
        res.status(200).json(respuesta);
    } catch (e) {
        console.error(e.message);
        res.status(403).send([])
    }
});




app.get('/persona/:id', async(req, res) => {

    try {
        const query = 'SELECT * FROM personass WHERE id = ?';
        const respuesta = await qy(query, [req.params.id]);
        if(respuesta.length == 1){
            res.status(200).json(respuesta[0]);
        }else{
            throw PERSONA_NO_ENCONTRADA;
        }
    } catch (e) {
        console.error(e.message);
        res.status(403);
        switch(e.code){
            case 'PERSONA_NO_ENCONTRADA':
                res.send({mensaje: e.message});
                break;
            default:
                res.send({mensaje: "error inesperado"});
        }
    }

});

app.put('/persona/:id', async(req, res) => {
    try {
        if (!req.body.nombre || !req.body.apellido || !req.body.alias || !req.body.email ||
            !req.body.nombre.trim() || !req.body.apellido.trim() || !req.body.alias.trim() || !req.body.email.trim()) {
            throw FALTAN_DATOS;
        }

        const persona ={
            id: req.params.id,
            nombre: req.body.nombre.trim(),
            apellido: req.body.apellido.trim(),
            alias: req.body.alias.trim(),
            email: req.body.email.trim().toUpperCase()
        }

        let respuesta = await qy('SELECT * FROM personass WHERE id = ?', [persona.id]);

        if(respuesta.length == 1){
            if(persona.email == respuesta[0].email){
                respuesta = await qy('UPDATE personas SET nombre = ?, apellido = ?, alias = ? WHERE id = ?', [persona.nombre, persona.apellido, persona.alias, persona.id]);
                registroNuevo = await qy('SELECT * FROM personas WHERE id=?', persona.id);
                res.status(200).json(registroNuevo[0]);
            }else{
                throw {code: 'MODIFICAR_EMAIL', message: 'el email no se puede modificar'};
            }
        }else{
            throw PERSONA_NO_ENCONTRADA
        }   

    } catch (e) {
        console.error(e.message);
        res.status(403)
        switch (e.code){
            case 'FALTAN_DATOS':
            case 'MODIFICAR_EMAIL':
            case 'PERSONA_NO_ENCONTRADA':
                res.send({mensaje: e.message});
                break;
            default:
                res.send({mensaje: 'error inesperado'});
                break;
        }
    }
});


app.delete('/persona/:id', async (req, res) =>{
    try {
        const id = req.params.id;
        let query = 'SELECT * FROM personas WHERE id = ?'
        let registro = await qy(query, [id]);
        if(registro.length == 1){
            query = 'SELECT * FROM libross WHERE id_persona = ?';
            registro = await qy(query, [req.params.id]);
            if(registro.length > 0){
                throw {code:'PERSONA_DATOS_ASOCIADOS', message:'persona con datos asociados, no se puede eliminar'};
            }
            registro = await qy('DELETE FROM personas WHERE id = ?', [id]);
            res.status(200).send({mensaje: "se borro correctamente"});
        }else{
            throw PERSONA_NO_ENCONTRADA;
        }
    }
    catch(e) {
        console.error(e.message);
        res.status(413);
        switch(e.code){
            case 'PERSONA_NO_ENCONTRADA':
            case 'PERSONA_DATOS_ASOCIADOS':
                res.send({mensaje: e.message});
                break;
            default:
                res.send({mensaje: 'error inesperado'});
                break;
        }
    } 
});



/* LIBRO */

app.post('/libro', async(req, res) => {
    try {
        if (!req.body.nombre || !req.body.categoria_id || req.body.nombre.trim()) {
            throw {code: 'FALTA_NOMBRE_CATEGORIA', message: 'nombre y categoria son datos obligatorios'};
        }
        const libro = {
            nombre: req.body.nombre.trim().toUpperCase(),
            descripcion: req.body.descripcion.trim(),
            categoria: req.body.categoria_id,
            persona: req.body.persona_id            
        }
        let query = 'SELECT * FROM categorias WHERE id = ?';
        let respuesta = await qy(query, [libro.categoria]);
        if (respuesta.length == 0) {
            throw CATEGORIA_NO_ENCONTRADA;
        }
        query = 'SELECT * FROM personas WHERE id = ?';
        respuesta = await qy(query, [libro.persona]);
        if (respuesta.length == 0) {
            throw PERSONA_NO_ENCONTRADA;
        }
        query = 'SELECT * FROM libros WHERE nombre = ?';
        respuesta = await qy(query, [libro.nombre]);
        if (respuesta.length > 0) {
            throw {code: 'LIBRO_YA_EXISTE', message: 'el libro ya se encuentra registrado'};
        }

        query = 'INSERT INTO libros (nombre, descripcion, categoria_id, persona_id ) VALUES (?, ?, ?, ?)';
        respuesta = await qy(query, [libro.nombre, libro.descripcion, libro.categoria_id, libro.persona_id]);
        const registroInsertado = await qy('SELECT * FROM libros WHERE id=?', [respuesta.insertId]);
        res.status(200).json(registroInsertado[0]);

    } catch (e) {
        console.error(e.message);
        res.status(403);
        switch(e.code){
            case 'FALTA_NOMBRE_CATEGORIA':
            case 'CATEGORIA_NO_ENCONTRADA':
            case 'PERSONA_NO_ENCONTRADA':
            case 'LIBRO_YA_EXISTE':
                res.send({mensaje: e.message});
                break;
            default:
                res.send({mensaje: 'error inesperado'});
                break
        }
    }
});

app.get('/libro', async(req, res) => {
    try {
        const query = 'SELECT * FROM libros';
        const respuesta = await qy(query);
        res.status(200).json(respuesta);
    } catch (e) {
        console.error(e.message);
        res.status(413).send([]);
    }
});




app.get('/libro/:id', async(req, res) => {
    try {
        const query = 'SELECT * FROM libross WHERE id = ?';
        const respuesta = await qy(query, [req.params.id]);
        if(respuesta.length == 1){
            res.status(200).json(respuesta[0]);
        }else{
            throw LIBRO_NO_ENCONTRADO;
        }
    } catch (e) {
        console.error(e.message);
        res.status(403);
        switch(e.code){
            case 'LIBRO_NO_ENCONTRADO':
                res.send({mensaje: e.message});
        }
    }

});

app.put('/libro/:id', async(req, res) => {
    try {

        if (!req.body.nombre || !req.body.descripcion || !req.body.categoria_id || !req.body.nombre.trim() || !req.body.descripcion.trim()){
            throw FALTAN_DATOS;
        }

        const libro = {
        id : req.params.id,
        nombre : req.body.nombre.trim().toUpperCase(),
        descripcion : req.body.descripcion.trim(),
        categoria : req.body.categoria_id,
        persona : req.body.persona_id,
        }

        let respuesta = await qy('SELECT * FROM libros WHERE id = ?', [libro.id]);

        if(respuesta.length == 1){  
            respuesta = await qy('SELECT * FROM libros WHERE id = ? AND nombre = ? AND categoria_id = ? AND persona_id = ?', [libro.id, libro.nombre, libro.categoria, libro.persona]);
            if (respuesta.length == 1){
                respuesta = await qy('UPDATE libros SET descripcion = ? WHERE id = ?', [libro.descripcion, libro.id]);
                registroNuevo = await qy('SELECT * FROM libros WHERE id=?', libro.id);
                res.status(200).json(registroNuevo[0]);
            }else{
                throw {code: 'LIBRO_MOD_CATEGORIA_PERSONA', message: 'solo se puede modificar la descripcion del libro'};
            }
        }else{
            throw LIBRO_NO_ENCONTRADO;
        }

    } catch (e) {
        console.error(e.message);
        res.status(403);
        switch(e.code){
            case 'FALTAN_DATOS':
            case 'LIBRO_MOD_CATEGORIA_PERSONA':
            case 'LIBRO_NO_ENCONTRADO':
                res.send({mensaje: e.message});
                break;
            default:
                res.send({mensaje: 'error inesperado'});
                break;
        }
    }
});


app.put('/libro/prestar/:id', async(req, res) => {


    try {

        if (!req.body.persona_id) { 
            throw FALTAN_DATOS;
        }

        const libro ={
            id : req.params.id,
            persona : req.body.persona_id
        }

        let respuesta = await qy('SELECT * FROM personas WHERE id = ?', [libro.persona]);
        if (respuesta.length == 0){
            throw PERSONA_NO_ENCONTRADA
        }
        let query = 'SELECT persona_id FROM libros WHERE id = ?';
        respuesta = await qy(query, [libro.id]);
        if (respuesta.length == 0) {
            throw LIBRO_NO_ENCONTRADO;
        }
        if(respuesta[0].persona_id != null){
            throw {code: 'LIBRO_PRESTADO', message: 'el libro ya se encuentra prestado, no se puede prestar hasta que no se devuelva'};
        }

        respuesta = await qy('UPDATE libros SET persona_id = ? WHERE id = ?', [libro.persona, libro.id]);
        res.status(200).send({mensaje: "se presto correctamente"})
        
    }

    catch (e) {
        console.error(e.message);
        res.status(403);
        switch(e.code){
            case 'FALTAN_DATOS':
            case 'LIBRO_NO_ENCONTRADO':
            case 'LIBRO_PRESTADO':
                res.send({mensaje: e.message});
                break;
            case 'PERSONA_NO_ENCONTRADA':
                res.send({mensaje: e.message + ' a la que se quiere prestar el libro'});
                break;
            default:
                res.send({mensaje: 'error inesperado'});
                break;
        }
    }
});

app.put('/libro/devolver/:id', async(req, res) => {
    try {

        const id = req.params.id;
        const query = 'SELECT persona_id FROM libros WHERE id = ?';
        const respuesta = await qy(query, [id]);

        if (respuesta.length == 0) {
            throw LIBRO_NO_ENCONTRADO;
        }
        if (registro[0].persona_id == null) {
            throw {code: 'LIBRO_NO_PRESTADO', message: 'el libro no esta prestado!'};
        }       

        query = 'UPDATE libros SET persona_id = NULL WHERE id = ?';
        respuesta = await qy(query, [id]);

        res.status(200).send({mensaje: "se realizo la devolucion correctamente"});  

    } catch (e) {
        console.error(e.message);
        res.status(403);
        switch(e.code){
            case 'LIBRO_NO_ENCONTRADO':
            case 'LIBRO_NO_PRESTADO':
                res.send({mensaje: e.message});
                break;
            default:
                res.send({mensaje: 'error inesperado'});
                break;
        }
    }
});

app.delete('/libro/:id', async(req, res) => {
    try {

        const id = req.params.id;
        const query = 'SELECT * FROM libros WHERE id = ?';
        const registro = await qy(query, [id]);

        if (registro.length == 0) {
            throw LIBRO_NO_ENCONTRADO
        }
        if (registro[0].persona_id != null) {
            throw {code: 'LIBRO_PRESTADO', message: 'ese libro esta prestado, no se puede borrar'};
        }

        query = 'DELETE FROM libros WHERE id = ?';
        registro = await qy(query, [id]);
        res.status(200).send({mensaje: "se borro correctamente"});

    } catch (e) {
        console.error(e.message);
        res.status(403);
        switch (e.code){
            case 'LIBRO_NO_ENCONTRADO':
            case 'LIBRO_PRESTADO':
                res.send({mensaje: e.message});
                break;
            default:
                res.send({mensaje: 'error inesperado'});
                break;
        }
    }
});


app.listen(port, () => {
    console.log('Servidor escuchando en el puerto', port)
});