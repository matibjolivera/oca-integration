const convert = require('xml-js');

const conversion = async (xml) => {
    console.log(xml)
    const string = convert.xml2json(xml, {
        compact: true,
        space: 4
    });
    return await JSON.parse(string)
}

module.exports = conversion