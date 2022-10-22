const express = require('express');
const app = express();
const axios = require('axios')
const conversion = require('./helpers/xml_to_json')

const OCA_URL = 'http://webservice.oca.com.ar/oep_tracking/Oep_Track.asmx/'

app.get('/api/provinces', async (req, res) => {
    let response = await axios.get(OCA_URL + 'GetProvincias');
    const provinces = await conversion(response.data)
})

app.listen(3000, () => {
    console.log(`Example app listening on port 3000`)
})
