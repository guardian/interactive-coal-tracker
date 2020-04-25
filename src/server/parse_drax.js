import fs from 'fs'
import fetch from 'node-fetch'
import _ from 'lodash'
import moment from 'moment'

const url2020 = `https://drax-production.herokuapp.com/api/1/generation-mix?date_from=2020-01-01T00%3A00%3A00%2B01%3A00&date_to=2021-01-01T00%3A00%3A00%2B01%3A00&group_by=30m`

const sum = (a, b) => a + b

const addUp = row => {
    return row.value.nuclear + row.value.biomass + row.value.coal + row.value.gas + row.value.hydro + row.value.wind + row.value.pumpedStorage + row.value.balance.french + row.value.balance.dutch + row.value.balance.irish + row.value.balance.pumpedStorage
}

// CHANGE THIS TO DRAX LATER

const dataHist = JSON.parse(fs.readFileSync('./src/server/days_hist_drax.json'))

const daysAndHours = n => {

    const d = Math.floor(n/24)
    const h = Math.floor((n % 24))

    if(d === 0 && h === 0) { return 'less than one hour' }

    if(d === 0 && h > 0) {
        return h === 1 ? '1 hour' : `${h} hours`
    }

    const dayStr = d === 1 ? '1 day' : `${d} days`
    const hourStr = h === 1 ? '1 hour' : `${h} hours`

    return h === 0 ? dayStr : `${dayStr} and ${hourStr}`

}

// 2020 STRIPE CHART

fetch(url2020).then( resp => resp.json() )
    .then( data => {

        const out = _(data)

        .filter( row => row.start.startsWith('2020') )
        .groupBy(row => row.start.slice(0, 10))
        .mapValues( arr => {

            console.log(arr[0])
 
            return arr.map( row => row.value.coal ).reduce(sum, 0) /
                arr.map( addUp ).reduce(sum, 0)

        } )
        .toPairs()
        .valueOf()

        console.log(out)

        // RUN LENGTH

        const burning = data.slice(-1)[0].value.coal > 0

        if(!burning) {

            const lastEntry = data.slice(-1)[0]
            const last = moment(lastEntry.end)

            console.log(last)

            const lastCoalEntry = data.slice().reverse().find( row => row.value.coal > 0 )

            fs.writeFileSync('./src/server/last_coal', burning ? 'burning' : moment(lastCoalEntry.end).format('YYYY-MM-DD HH:mm:ss'))

            const runLength = moment.duration(last.diff(moment(lastCoalEntry.end))).asHours()

            console.log('RUn:', daysAndHours(runLength))
            fs.writeFileSync('./src/server/coal_run', daysAndHours(runLength))        

            const lastPerc = lastEntry.value.coal/addUp(lastEntry)
            fs.writeFileSync('./src/server/last_percent', String(lastPerc))

            fs.writeFileSync('./src/server/last_updated', moment().utcOffset('+01:00').format('h:mma on D MMMM'))

        }

        // COMBINE WITH HISTORIC

        const combined = [ ...dataHist, out ]

        fs.writeFileSync('./src/server/days_combined.json', JSON.stringify(combined))

    } )
