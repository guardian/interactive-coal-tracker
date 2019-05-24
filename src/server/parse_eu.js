import fs from 'fs'
import sync from 'csv-parse/lib/es5/sync'

const data = sync(fs.readFileSync('./src/server/eu_generation.csv'))

const codes = {

    UK : 'UK',
    Ireland : 'IE',
    Sweden : 'SE',
    Finland : 'FI',
    Estonia : 'EE',
    Latvia : 'LV',
    Lithuania : 'LT',
    Netherlands : 'NL',
    Denmark : 'DK',
    Luxembourg : 'LU',
    Belgium : 'BE',
    Germany : 'DE',
    France : 'FR',
    Spain : 'ES',
    Portugal : 'PT',
    Italy : 'IT',
    Austria : 'AT',
    Slovenia : 'SI',
    Malta : 'MT',
    Poland : 'PL',
    'Czech Republic' : 'CZ',
    Slovakia : 'SK',
    Hungary : 'HU',
    Croatia : 'HR',
    Romania : 'RO',
    Bulgaria : 'BG',
    Greece : 'GR',
    Cyprus : 'CY'
}

const out = data
    .map( row => {

        const country = row[0]

        const code = codes[country]

        const countryData = []
        
        const numSources = 10

        Array(numSources).fill().forEach((_, i) => {

            const source = data[0][i*19 + 1 ]

            const theShares = row.slice(i*19 + 2, (i+1)*19 + 1).map( str => Number(str.replace('%', '')) )

            countryData.push({ source, data : theShares })

        })

        const coal1 = countryData.find( o => o.source === 'Lignite' )
        const coal2 = countryData.find( o => o.source === 'Hard Coal' )

        const foss1 = countryData.find( o => o.source === 'Gas' )
        const foss2 = countryData.find( o => o.source === 'Other Fossil' )

        countryData.push({ source : 'Coal', data : coal1.data.map( (v, i) => v + coal2.data[i] ) })
        countryData.push({ source : 'Other fossil fuels', data : foss1.data.map( (v, i) => v + foss2.data[i] ) })

        return { country, code, data : countryData }

    } )

    .filter( o => o.code )

console.log(out)

fs.writeFileSync('./src/server/eu_generation.json', JSON.stringify(out, null, 2))