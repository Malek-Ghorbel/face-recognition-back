const express = require('express') ;
const bodyParser = require('body-parser') ;
const cors = require('cors') ;
const knex = require('knex') ;
const bcrypt = require('bcrypt-nodejs') ;

const db = knex({
    client: 'pg',
    connection : {
        host: '127.0.0.1' ,
        user: 'postgres' ,
        password: '6251' ,
        database : 'smart-brain' ,
    }
}) ;

const app = express() ;
app.use(bodyParser.json()) ;
app.use(cors()) ;

const database = {
    users : [
        {
            id: '123',
            name: 'hamma' ,
            email: 'hamma@gmail.com' ,
            password: 'hamma120' ,
            entries: 0 ,
            joined:  new Date() 
        },
        {
            id: '124',
            name: 'hamma2' ,
            email: 'hamma2@gmail.com' ,
            password: 'hamma220' ,
            entries: 0 ,
            joined:  new Date() 
        }
    ]
}

app.get('/' , (req , res) => {
    res.send(database.users) 
})

app.post('/signin' , (req, res) => {
    db.select('email' , 'hash').from('login')
    .where('email' , '=' , req.body.email)
    .then(data => {
        const valid=bcrypt.compareSync(req.body.password, data[0].hash) ;
        if (valid) {
            return db.select('*').from('users')
            .where('email' , '=' , req.body.email)
            .then(user => res.json(user[0]) ) 
            .catch(err => res.status(400).json('unable to get user')) 
        }
        else res.status(400).json('wrong credentials') ;
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register' , (req, res) => {
    const {email , name, password} = req.body ;
    if(!email || !name || !password) return res.status(400).json('dont leave it empty wtf xD')
    const hash = bcrypt.hashSync(password);

    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email,
        })
        .into('login')
        .returning('email') 
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date() ,
            })
            .then(user => res.json(user[0]) )
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('error (maybe email already exist)')) ;
})

app.get('/profile/:id' , (req,res) => {
    const {id} = req.params ;
    let found = false ;
    db.select('*').from('users').where({
        id: id
    })
    .then(user =>{ 
        if(user.length) res.json(user[0]) ;
        else res.status(400).json('not found') ;
    });
})

app.put('/image' , (req, res) => {
    const {id} = req.body ;
    db('users').where('id', '=' , id) 
    .increment('entries' , 1)
    .returning('entries')
    .then(e => {
        res.json(e[0]) ;
    })
    .catch(err => res.status(400).json('not found') ) ; 
})

app.listen(3000, () => {
    console.log('app running');
})