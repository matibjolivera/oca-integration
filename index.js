const express = require('express');
const app = express();
const axios = require('axios')
const qs = require('qs');
const conversion = require('./helpers/xml_to_json')
const XMLWriter = require('xml-writer');
require('dotenv').config();

app.use(express.json())

const OCA_URL = 'http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx'

app.get('/api/provinces', async (req, res) => {
    let response = await axios.get(`${OCA_URL}/GetProvincias`);
    res.json(await conversion(response.data))
})

app.get('/api/offices', async (req, res) => {
    let response = await axios.get(`${OCA_URL}/GetCentrosImposicion`);
    res.json(await conversion(response.data))
})

app.get('/api/shipping_status', async (req, res) => {
    let response = await axios.get(`${OCA_URL}/Tracking_PiezaNumeroEnvio?Pieza=${req.query.tracking_number}`);
    res.json(await conversion(response.data))
})

app.get('/api/estimate_shipping_cost', async (req, res) => {
    let response = await axios.get(`${OCA_URL}/Tarifar_Envio_Corporativo?PesoTotal=${req.query.weight}&VolumenTotal=${req.query.volume}&CodigoPostalOrigen=${req.query.zip_code_origin}&CodigoPostalDestino=${req.query.zip_code_destination}&Cuit=${req.query.cuit}&Operativa=${req.query.operative}&CantidadPaquetes=1&ValorDeclarado=${req.query.declarated_value}`);
    res.json(await conversion(response.data))
})

function getXMLORByOrder(xw, orders) {
    orders.forEach((order) => {
        xw.write(`<envio idoperativa="${order.operative_number}" nroremito="${order.id}">`);
        xw.write(`<destinatario apellido="${order.lastname}" nombre="${order.firstname}" calle="${order.street}" nro="${order.number}" piso="${order.floor}" depto="${order.door}" localidad="${order.city}" provincia="${order.province}" cp="${order.zip_code}" telefono="${order.phone}" email="${order.email}" idci="0" celular="${order.phone}" observaciones="${order.notes}"/>`);
        xw.write('<paquetes>');
        xw.write(`<paquete alto="${order.height}" ancho="${order.width}" largo="${order.length}" peso="${order.weight}" valor="${order.price}" cant="${order.quantity}"/>`);
        xw.write('</paquetes>');
        xw.write('</envio>');
    })
    return xw
}

async function getXMLOR(orders) {
    let xw = new XMLWriter(true);
    xw.startDocument();
    xw.write('<ROWS>')
    xw.write(`<cabecera ver="2.0" nrocuenta="${process.env.ACCOUNT_NUMBER_OCA}"/>`)
    xw.write('<origenes>');
    xw.write(`<origen calle="${process.env.ORIGIN_STREET}" nro="${process.env.ORIGIN_NUMBER}" piso="${process.env.ORIGIN_FLOOR}" depto="${process.env.ORIGIN_DOOR}" cp="${process.env.ORIGIN_ZIP_CODE}" localidad="${process.env.ORIGIN_CITY}" provincia="${process.env.ORIGIN_PROVINCE}" contacto="" email="${process.env.ORIGIN_EMAIL}" solicitante="" observaciones="" centrocosto="" idfranjahoraria="1" idcentroimposicionorigen="0" fecha="20221031">`);
    xw.write('<envios>');
    xw = await getXMLORByOrder(xw, orders);
    xw.write('</envios>');
    xw.write('</origen>');
    xw.write('</origenes>');
    xw.write('</ROWS>');
    xw.endDocument();
    console.log(xw.toString())
    return xw.toString();
}

app.post('/api/generate_or', async (req, res) => {
    const data = qs.stringify({
        'usr': process.env.USER_OCA,
        'psw': process.env.PASSWORD_OCA,
        'xml_Datos': await getXMLOR(req.body.orders),
        'ConfirmarRetiro': process.env.SEND_WITHOUT_CART,
        'ArchivoCliente': '',
        'ArchivoProceso': ''
    });
    const config = {
        method: 'post',
        url: OCA_URL + '/IngresoORMultiplesRetiros',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };

    const response = await axios(config)
    const json = await conversion(response.data)
    res.json(json.DataSet['diffgr:diffgram'].Resultado.DetalleIngresos)
})

app.listen(3000, () => {
    console.log(`Example app listening on port 3000`)
})
