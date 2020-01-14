import fs from 'fs'
import sync from 'csv-parse/lib/es5/sync'
import _ from 'lodash'

const sum = (a, b) => a + b

const data = sync(fs.readFileSync('./src/server/gridwatch_new.csv'), { columns : true })

const addUp = row => {
    return ' coal, nuclear, ccgt, wind, pumped, hydro, biomass, oil, solar, ocgt, other'.split(',')
        .map( k => Number(row[k]) ).reduce(sum, 0)
}

const out = _(data)
    .groupBy(row => row[' timestamp'].slice(0, 11).trim())
    .mapValues( arr => {

        return arr.map( row => Number(row[' coal']) ).reduce(sum, 0) /
            arr.map( addUp ).reduce(sum, 0)

    } )
    .toPairs()

    .groupBy( t => t[0].slice(0, 4) )
    .toPairs()

    .slice(0)

    .valueOf()

console.log(out)

fs.writeFileSync('./src/server/days.json', JSON.stringify(out))

const dataHist = out.filter( t => t[0] !== '2020' ).map( t => t[1] )
const data2020 = out.find( t => t[0] === '2020' )[1]

fs.writeFileSync('./src/server/days_hist.json', JSON.stringify(dataHist))
fs.writeFileSync('./src/server/days_2020.json', JSON.stringify(data2020))