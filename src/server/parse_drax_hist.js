import * as d3 from 'd3'
import fetch from 'node-fetch'
import { pseq, wait } from '../js/util'
import fs from 'fs'


const years = d3.range(2012, 2020)

const sum = (a, b) => a + b

const addUp = row => {
    return row.value.nuclear + row.value.biomass + row.value.coal + row.value.gas + row.value.hydro + row.value.wind + row.value.pumpedStorage + row.value.balance.french + row.value.balance.dutch + row.value.balance.irish + row.value.balance.pumpedStorage
}

const out = []

pseq(years, year => {

    const url = `https://drax-production.herokuapp.com/api/1/generation-mix?date_from=${year}-01-01T00%3A00%3A00%2B01%3A00&date_to=${year+1}-01-01T00%3A00%3A00%2B01%3A00&group_by=1d`

    return wait(2000).then(() => fetch(url)).then( resp => resp.json() ).then( data => {

        console.log(data)

        const mapped = data
        
        .filter( row => row.start.startsWith(String(year)) )
        .map( row => {
            
            const perc = row.value.coal/addUp(row)
            return [ row.start.slice(0, 10), perc ]

        })

        console.log(`${year} (${mapped.length} days)`)

        out.push(mapped)

        fs.writeFileSync('./src/server/days_hist_drax.json', JSON.stringify(out))

    } )

})