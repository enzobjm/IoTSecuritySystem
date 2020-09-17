var qr = require('qr-image');
const http = require('http')
var express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const keys = require('./schemas/key')
const residents = require('./schemas/resident')
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = mongoose.connection
const app = express()
const port = 8080
connectMongo()
setupApp()

const server = http.createServer(app)
const router = express.Router()

//Param: guid=3539eace-2c52-473c-afef-7122cba349a2
const qrFromGuid = router.get('/getQRFromGuid', (req, res, next) => {
  try {
    var code = qr.image(req.query.guid, { type: 'png' });
    res.type('png');
    code.pipe(res);
  }
  catch (ex) {
    return res.status(400).send({
      message: ex.message
   });
  }
})

//Param: guid=3539eace-2c52-473c-afef-7122cba349a2
const getGuidStatus = router.get('/getGuidStatus', (req, res, next) => {
  try {
    keys.findOne({key: req.query.guid}, function (err, docs) { 
      if(docs == null || docs == undefined) {
        res.status(406).send({message: "Inexistent"}).end()
      }
      else if(new Date() > docs.expirationDate) {
        console.log(new Date())
        console.log(docs)
        res.status(410).send({message: "Expired"}).end()
      }
      else {
        res.status(400).send({message: "Valid"}).end()
      }
    });
  }
  catch (ex) {
    return res.status(400).send({
      message: ex.message
   });
  }
})

//Param: id=CreatorId
const getUserGuids = router.get('/getUserGuids', (req, res, next) => {
  try {
    if(req.query.id == undefined) {
      throw new Error("NotResident")
    }
    let now = new Date();
    keys.find({creator: req.query.id, expirationDate: {$gt: now}}, function (err, docs) { 
      console.log(docs)
      res.status(200).send(docs).end()
    });
  }
  catch (ex) {
    return res.status(400).send({
      message: ex.message
   });
  }
})

//Param: name=userName
const getUserId = router.get('/getUserId', (req, res, next) => {
  console.log(req.query.name)
  try {
    if(req.query.name == undefined) {
      throw new Error("NotResident")
    }
    residents.find({name: "Enzo Bustamante Junco Mendonça"}, function (err, docs) { 
      console.log("84")
      if(err) {
        console.log(err)
        throw new Error("NotResident")
      }
      console.log(docs)
      res.status(200).send(docs[0]._id).end()
    });
  }
  catch (ex) {
    return res.status(400).send({
      message: ex.message
   }.end());
  }
})


//Param: id="CreatorId", days=(int)daysDurationOffset, hours=(int)hoursDurationOffset, minutes=(int)minutesDurationOffset
const newGuid = router.post('/newGuid', (req, res, next) => {
  console.log(req.body.creator)
  if(req.body.creator == undefined) {
    return res.status(400).send({
      message: "CreatorEmpty"
   });
  }
  
  residents.exists({ _id: req.body.creator }, function(err, result) {
    if (err || !result) {
      return res.status(403).send({
        message: "NotResident"
     });
    }
    //ToDo: Let user give a name for the key 
    else {
      let guid = uuidv4(); 
      var date = expirationDate(req.body.daysDurationOffset, req.body.hoursDurationOffset, req.body.minutesDurationOffset)
      let key = new keys({"key": guid, "expirationDate": date, "creator": req.body.creator})
      key.save()
      let code = qr.image(guid, { type: 'png' });
      res.type('png');
      code.pipe(res);
    }
  });
})

//Param: creator="creatorName", name="residentName", cpf="cpfString", phone="residentPhone", email="residentEmail"
const newResident = router.post('/newResident', (req, res, next) => {
  if(req.body.creator == undefined || req.body.name == undefined) {
    return res.status(400).send({
      message: "RequiredFieldEmpty"
   }).end();
  }
  //ToDo: Verify if creator is building administrator
  else {
    let resident = new residents({"name": req.body.name, "creator": req.body.creator, "cpf": req.body.cpf, "phone": req.body.phone, "email": req.body.phone})
    resident.save().then(x => {
        res.status(200).send({id: x._id}).end()
    }).catch(e => {
      res.status(400).end()
    })
  }
})

function expirationDate(dayOffset, hourOffset, minutesOffset) {
  if(dayOffset == undefined) 
  dayOffset = 0
  if(hourOffset == undefined) 
    hourOffset = 0
  if(minutesOffset == undefined) 
  minutesOffset = 0
      
  let now = new Date()
  let date = new Date()
  date.setDate(now.getDate() + dayOffset);
  date.setHours(now.getHours() + hourOffset);
  date.setMinutes(now.getMinutes() + minutesOffset)

  return date
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

app.use('/', [qrFromGuid, newGuid, newResident, getUserGuids, getUserId])
server.listen(port)