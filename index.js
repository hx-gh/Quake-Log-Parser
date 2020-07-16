const express = require('express');
const app = express();
const { readLog, parseLog } = require('./utilities/controllers')
const PORT = process.env.PORT || 8000;
const file = './Quake.txt'
//GET Request
app.get('/api/quakeapi', async (req,res) => {
    const lines = await readLog(file)
    const games = await parseLog(lines)
    res.status(200).send({success: "true", date: new Date(Date.now()), games})  
})




app.listen(PORT, () => { console.log(`[SERVER] Listening to PORT ${PORT}`) })