const bodyParser = require('body-parser');
const { query } = require('express');
const express = require('express');
const mysql = require('mysql');
const util = require ('util');

const app = express();

app.use(express.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
});

connection.connect((error) => {
    if(error) {
        throw error;
    }
     console.log('Conexión con la base de datos MySQL establecida');
});

// permite el uso de async-await en mysql
const qy = util.promisify(connection.query).bind(connection);

app.post('/categorias', async (req, res) => {
    try{
    
    //Validación del envío correcto de la información
    if (!req.body.nombre) {
        throw new Error ('No se envió el nombre');
    }

    // Verificación de existencia previa del nombre
    let query = 'SELECT id FROM categorias WHERE nombre = ?'
    let respuesta = await qy(query, [req.body.nombre]);
    if (respuesta.length > 0) {
        throw new Error ('El género ya existe');
    }

    //Si el género no existe, se procede a guardar el registro
    query = 'INSERT INTO categorias (nombre) VALUE (?)';
    respuesta = await qy(query, [req.body.nombre]);

    res.send({"respuesta": respuesta});

    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
});

app.get('/categorias', async (req, res) => {
    try{
    // Se consulta si existe el nombre buscado y se almacena la respuesta
    const query = 'SELECT * FROM categorias';
    const respuesta = await qy(query);
    res.send({"respuesta": respuesta});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
});

app.get('/categorias/:id', async (req, res) => {
    try{
        const query = 'SELECT * FROM categorias WHERE id = ?';
        const respuesta = await qy(query, [req.params.id]);
        res.send({"respuesta": respuesta});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }    
});

app.delete('/categorias/:id', async (req, res) => {
    try{
    //Verificación de vinculación foránea, de existir, no se permite borrar
    let query = 'SELECT * FROM libros WHERE id_categoria = ?'
    let respuesta = await qy(query, [req.params.id]);

    if (respuesta.length > 0) {
        throw new Error ('El género se está usando en la tabla libros, no se puede borrar');
    }
    query = 'DELETE FROM categorias WHERE id = ?'
    respuesta = await qy(query, [req.params.id]);
    res.send({"respuesta" : "El registro se borró correctamente"});


    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }        
});

// PERSONA

app.post('/personas', async (req, res) => {
    try{
        if (!req.body.nombre || !req.body.apellido || !req.body.email || !req.body.alias) {
            throw new Error ('No se enviaron los datos obligatorios (Nombre, Apellido, Email, Alias)');
        }
        //Verificación de que el email no se repita
        /*No es necesario verificar esto mediante una consulta,
        se restringió el valor del campo a tipo único*/

        // Si el mail no está repetido, se continúa con el ingreso de datos
        query ='INSERT INTO personas (nombre, apellido, email, alias) VALUES (?, ?, ?, ?)'
        respuesta = await qy(query, [req.body.nombre, req.body.apellido, req.body.email, req.body.alias])
        res.send({"respuesta": [req.body.nombre, req.body.apellido, req.body.email, req.body.alias]})
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }            
});

app.get('/personas', async (req, res) => {
    try{
        const query = 'SELECT * FROM personas'
        const respuesta = await qy(query);
        res.send({"respuesta": respuesta});
    }

    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }         
});

app.get('/personas/:id', async (req, res) => {
    try {
        const query = 'SELECT * FROM personas WHERE id = ?';
        const respuesta = await qy(query, [req.params.id]);
        res.send({"respuesta" : respuesta});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }             
});

app.put('/personas/:id', async (req, res) => {
    try{
    //Se verifica que se envíen todos los datos (excepto el mail que no puede modificarse)
    if(!req.body.nombre || !req.body.apellido || !req.body.alias) {
        throw new Error ('Falta enviar uno o más datos a actualizar: nombre, apellido, alias')
    }

    const query = 'UPDATE personas SET nombre = ?, apellido = ?, alias = ? WHERE id = ?'
    const respuesta = await qy(query, [req.body.nombre, req.body.apellido, req.body.alias, req.params.id]);
    res.send({"respuesta": ["Se han actualizado todos los datos excepto el email que no se puede modificar", respuesta]
});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }      
});

app.delete('/personas/:id', async (req, res) =>{
    try {
        let query = 'SELECT * FROM libros WHERE id_persona = ?';
        let respuesta = await qy(query, [req.params.id]);
        if (respuesta.length > 0){
            throw new Error ("Esta persona tiene un libro en préstamo, no puede eliminarse")
        }

        query = 'DELETE FROM personas WHERE id = ?'
        respuesta = await qy(query, [req.params.id]);
        res.send({"respuesta": "El registro se ha eliminado correctamente"});
    }

    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    } 
});

app.listen(process.env.PORT || 3000, () => {
    console.log('http://localhost:3000');

});
