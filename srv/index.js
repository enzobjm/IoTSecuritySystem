const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const Client = require('./schemas/client')
const Product = require('./schemas/product')
const SellProduct = require('./schemas/sellProduct')
const Service = require('./schemas/service')
const SellService = require('./schemas/sellService')
const ServiceAvailable = require('./schemas/serviceAvailable')

const { json } = require('body-parser')
const { query } = require('express')



const db = mongoose.connection
const app = express()
const port = 8800
connectMongo()
setupApp()

const server = http.createServer(app)
const router = express.Router()

//ALL GET
//FROM BOTH CLIENT AND ADMIN SIDE
const getProducts = router.get('/getProducts', (req, res, next) => {
    Product.find()
    .then(data => {
        res.status(200).send(data).end()
    }).catch(ex => {
        console.log(ex)
        res.status(400).end()
    })
})
const getServices  = router.get('/getServices', (req, res, next) => {
    Service.find()
    .then(data => {
        res.status(200).send(data).end()
    }).catch(ex => {
        console.log(ex)
        res.status(400).end()
    })
})
//FROM JUST ADMIN SIDE
const getSellServices = router.get('/getSellServices', (req, res, next) => {
    query = {}
    if(req.query.q != null) {
        query = JSON.parse(req.query.q)
    }
    query = queryToRegex()

    SellService.find(query)
    .then(data => {
        res.status(200).send(data).end()
    }).catch(ex => {
        console.log(ex)
        res.status(400).end()
    })
})
const getSellProducts = router.get('/getSellProducts', (req, res, next) => {
    query = {}
    if(req.query.q != null) {
        query = JSON.parse(req.query.q)
    }
    query = queryToRegex()

    SellProduct.find(query)
    .then(data => {
        res.status(200).send(data).end()
    }).catch(ex => {
        console.log(ex)
        res.status(400).end()
    })
})
const getAllClients = router.get('/getAllClients', (req, res, next) => {
    Client.find()
    .then(data => {
        res.status(200).send(data).end()
    }).catch(ex => {
        console.log(ex)
        res.status(400).end()
    })
})
const getClientServicesAndProducts = router.get('/getClientServicesProducts', (req, res, next) => {
    query = {}
    if(req.query.q != null) {
        query = JSON.parse(req.query.q)
        if(query["name"] != null) {
            query = {name : query["name"]}
        }
    }
    query = queryToRegex()
    result = {services : null, products : null}

    SellService.find(query)
    .then(data => {
        result.services = data;
    }).catch(ex => {})

    SellProduct.find(query)
    .then(data => {
        result.products = data;
    }).catch(ex => {})

    res.status(200).send(result).end()
})

//ALL POST
const buyProduct = router.post('/buyProduct', (req, res, next) => {
    console.log(req.body);
    var product = new SellProduct(req.body)
    product.save().then(x => {
        console.log("here")
        res.status(200).send({id: x._id}).end()
    }).catch(e => {
        console.log(e)

        res.status(400).end()
    })
})
const buyService = router.post('/buyService', (req, res, next) => {
    var service = new SellService(req.body)

    ServiceAvailable.findOneAndUpdate({name: req.body.title}, { $inc: { no_of_likes: 1 } , "$push": { "notAvailable": req.body.time } })

    service.save().then(x => {
        res.status(200).send({id: x._id}).end()
    }).catch(e => {
        res.status(400).end()
    })
})
const addProduct = router.post('/addProduct', (req, res, next) => {
    var product = new Product(req.body)
    product.save().then(x => {
        res.status(200).send({id: x._id}).end()
    }).catch(e => {
        res.status(400).end()
    })
})
const addService = router.post('/addService', (req, res, next) => {
    var service = new Service(req.body)
    service.save().then(x => {
        res.status(200).send({id: x._id}).end()
    }).catch(e => {
        res.status(400).end()
    })
})

app.use('/', [getProducts,getServices,getSellServices,getSellProducts,getAllClients,
    getClientServicesAndProducts,buyProduct,buyService,addProduct,addService])
server.listen(port)

function queryToRegex(query) {
    Object.entries(query).forEach(([key, val]) => {
        if("string" === typeof val) {
            query[key] = new RegExp(["", val, ""].join(""), "i")
        }
        else {
            query[key] = {"$in" : val}
        }
    });
    return query
}

async function connectMongo() {
    mongoose.connect('mongodb+srv://web:web@trabalhoweb.3cx9b.gcp.mongodb.net/trabalhoWeb', { useNewUrlParser: true, useUnifiedTopology: true })
    db.once('open', _ => {
        console.log('Database connected')
    })

    db.on('error', err => {
        console.error('connection error: ', err)
    })
}

function setupApp() {
    app.set('port', port)
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(cors())
}