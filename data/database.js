// data/database.js
const dotenv = require("dotenv");
dotenv.config();
const { MongoClient } = require("mongodb");

let _database; // Use uma variável para o cliente do banco de dados

const initDb = (callback) => {
    if (_database) {
        console.log("Database is already initialized!");
        return callback(null, _database);
    }
    MongoClient.connect(process.env.MONGODB_URI)
        .then((client) => {
            _database = client; // Corrigido: armazena o cliente MongoDB completo
            console.log("Database connected!");
            callback(null, _database);
        })
        .catch((err) => {
            console.error("Failed to connect to the database:", err);
            callback(err);
        });
};

const getDb = () => {
    if (!_database) {
        throw new Error("Database is not initialized. Call initDb first.");
    }
    return _database; // Retorna o cliente MongoDB
};

module.exports = {
    initDb,
    getDb,
};