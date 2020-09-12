const moongose = require('mongoose')
const Schema = moongose.Schema

const schema = new Schema({
    name: {
        type: String,
        required: [true, 'The Name Is Required'],
        trim: true,
        index: true,
    },
    creator: {
        type: String,
        required: [true, 'The Creator Is Required'],
        trim: true,
    },
    cpf: {
        type: String,
        required: [false, 'Cpf Is Not Required'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Fone Is Not Required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email Is Not Required'],
        trim: true,
    },
});

module.exports = moongose.model('residents', schema)