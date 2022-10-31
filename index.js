const express = require('express');
const app = express();
const axios = require('axios')
const conversion = require('./helpers/xml_to_json')

const OCA_URL = 'http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/'

app.get('/api/provinces', async (req, res) => {
    let response = await axios.get(`${OCA_URL}GetProvincias`);
    res.json(await conversion(response.data))
})

app.get('/api/offices', async (req, res) => {
    let response = await axios.get(`${OCA_URL}GetCentrosImposicion`);
    res.json(await conversion(response.data))
})

app.get('/api/shipping_status', async (req, res) => {
    let response = await axios.get(`${OCA_URL}Tracking_PiezaNumeroEnvio?Pieza=${req.query.tracking_number}`);
    res.json(await conversion(response.data))
})

app.get('/api/estimate_shipping_cost', async (req, res) => {
    let response = await axios.get(`${OCA_URL}Tarifar_Envio_Corporativo?PesoTotal=${req.query.weight}&VolumenTotal=${req.query.volume}&CodigoPostalOrigen=${req.query.zip_code_origin}&CodigoPostalDestino=${req.query.zip_code_destination}&Cuit=${req.query.cuit}&Operativa=${req.query.operative}&CantidadPaquetes=1&ValorDeclarado=${req.query.declarated_value}`);
    res.json(await conversion(response.data))
})


app.listen(3000, () => {
    console.log(`Example app listening on port 3000`)
})
