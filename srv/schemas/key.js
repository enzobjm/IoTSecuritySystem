const moongose = require('mongoose')
const Schema = moongose.Schema

const schema = new Schema({
    key: {
        type: String,
        required: [true, 'The Guid Is Required'],
        trim: true,
        index: true,
    },
    expirationDate: {
        type: Date,
        required: [true, 'Expiration Date Is Required'],
        trim: true,
    },
    creator: {
        type: String,
        required: [true, 'Creator Name Is Required'],
        trim: true,
    },
});

module.exports = moongose.model('keys', schema)
