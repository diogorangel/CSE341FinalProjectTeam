// controllers/records.js
const Record = require('../models/record');

// POST /record - CREATE: Adds a new record
exports.createRecord = async (req, res) => {
    // #swagger.tags = ['Records']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'Record data to be created.',
        required: true,
        schema: { $ref: "#/definitions/RecordUpdate" } 
    } */
    /* #swagger.responses[201] = {
        description: 'Record successfully created.',
        schema: { $ref: "#/definitions/Record" }
    } */
    /* #swagger.responses[400] = { description: 'First name is a required field.' } */
    /* #swagger.responses[401] = { description: 'Access denied. Please log in.' } */
    /* #swagger.responses[500] = { description: 'Internal Server Error' } */
    try {
        const ownerId = req.session.userId; 
        const recordData = { 
            ...req.body, 
            ownerId: ownerId 
        };
        
        // Stretch Challenge Implementation: Basic validation
        if (!recordData.firstName) {
            return res.status(400).json({ message: 'First name is a required field.' });
        }

        const newRecord = await Record.create(recordData);
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /record - READ: Returns all records for the logged-in user
exports.getAllRecords = async (req, res) => {
    // #swagger.tags = ['Records']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['search'] = {
        in: 'query',
        description: 'Search term for first or last name.',
        type: 'string'
    } */
    /* #swagger.responses[200] = {
        description: 'Successfully retrieved list of records.',
        schema: [ { $ref: "#/definitions/Record" } ]
    } */
    /* #swagger.responses[401] = { description: 'Access denied. Please log in.' } */
    /* #swagger.responses[500] = { description: 'Internal Server Error' } */
    try {
        const ownerId = req.session.userId;
        const { search } = req.query; // Stretch Challenge Implementation: Filtering
        
        let filter = { ownerId: ownerId };
        
        if (search) {
            // Simple search by firstName or lastName (case-insensitive)
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }

        // Authorization: Filters ONLY by records belonging to the logged-in user
        const records = await Record.find(filter); 
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /record/{id} - READ: Returns a single specific record
exports.getSingleRecord = async (req, res) => {
    // #swagger.tags = ['Records']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.responses[200] = {
        description: 'Successfully retrieved the record.',
        schema: { $ref: "#/definitions/Record" }
    } */
    /* #swagger.responses[401] = { description: 'Access denied. Please log in.' } */
    /* #swagger.responses[404] = { description: 'Record not found or access denied.' } */
    /* #swagger.responses[500] = { description: 'Internal Server Error' } */
    try {
        const recordId = req.params.id;
        const ownerId = req.session.userId;

        // Authorization: Looks for the record ID AND the corresponding ownerId
        const record = await Record.findOne({ _id: recordId, ownerId: ownerId });

        if (!record) {
            // 404 if not found OR if found but belongs to another user (Access denied)
            return res.status(404).json({ message: 'Record not found or access denied.' });
        }
        
        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; // <-- Closing brace was missing here!

// PUT /record/{id} - UPDATE: Modifies an existing record
exports.updateRecord = async (req, res) => {
    // #swagger.tags = ['Records']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'Updated record data.',
        required: true,
        schema: { $ref: "#/definitions/RecordUpdate" }
    } */
    /* #swagger.responses[200] = {
        description: 'Record successfully updated.',
        schema: { $ref: "#/definitions/Record" }
    } */
    /* #swagger.responses[401] = { description: 'Access denied. Please log in.' } */
    /* #swagger.responses[404] = { description: 'Record not found or access denied.' } */
    /* #swagger.responses[500] = { description: 'Internal Server Error' } */
    try {
        const recordId = req.params.id;
        const ownerId = req.session.userId;

        // Authorization: Updates only if the ownerId is the logged-in user
        const updatedRecord = await Record.findOneAndUpdate(
            { _id: recordId, ownerId: ownerId }, 
            req.body, 
            { new: true, runValidators: true } 
        );

        if (!updatedRecord) {
            return res.status(404).json({ message: 'Record not found or access denied.' });
        }

        res.status(200).json(updatedRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /record/{id} - DELETE: Removes a record
exports.deleteRecord = async (req, res) => {
    // #swagger.tags = ['Records']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.responses[204] = { description: 'Record successfully deleted (No Content).' } */
    /* #swagger.responses[401] = { description: 'Access denied. Please log in.' } */
    /* #swagger.responses[404] = { description: 'Record not found or access denied.' } */
    /* #swagger.responses[500] = { description: 'Internal Server Error' } */
    try {
        const recordId = req.params.id;
        const ownerId = req.session.userId;

        // Authorization: Deletes only if the ownerId is the logged-in user
        const deletedRecord = await Record.findOneAndDelete({ _id: recordId, ownerId: ownerId });

        if (!deletedRecord) {
            return res.status(404).json({ message: 'Record not found or access denied.' });
        }

        // 204 No Content for successful removal
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};