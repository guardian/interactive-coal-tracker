import fetch from 'node-fetch'
import moment from 'moment'
import { URLSearchParams } from 'url'
import fs from 'fs'
import sync from 'csv-parse/lib/es5/sync'
import _ from 'lodash'

const sum = (a, b) => a + b

const url = `https://gridwatch.templar.co.uk/do_download.php`

const addUp = row => {
    return ' coal, nuclear, ccgt, wind, pumped, hydro, biomass, oil, solar, ocgt, other'.split(',')
        .map( k => {
            
            return Number(row[k])
        
        }).reduce(sum, 0)
}


const params = new URLSearchParams()

const dataHist = JSON.parse(fs.readFileSync('./src/server/days_hist.json'))
const data2019 = JSON.parse(fs.readFileSync('./src/server/days_2019.json'))

const lastDay = data2019.slice(-1)[0][0]

let prevLastCoal = fs.readFileSync('./src/server/last_coal')

console.log(lastDay)

const prev = moment(`${lastDay} 00:00`, 'YYYY-MM-DD HH:mm')

const now = moment().subtract(1, 'hour')

params.append('none', 'off')
params.append('demand', 'on')
params.append('frequency', 'off')
params.append('coal', 'on')

params.append('nuclear', 'on')
params.append('ccgt', 'on')
params.append('wind', 'on')
params.append('pumped', 'on')
params.append('nuclear', 'on')
params.append('hydro', 'on')
params.append('biomass', 'on')
params.append('oil', 'on')
params.append('solar', 'on')
params.append('ocgt', 'on')
params.append('french_ict', 'off')
params.append('dutch_ict', 'off')
params.append('irish_ict', 'off')
params.append('ew_ict', 'off')
params.append('nemo', 'off')
params.append('other', 'on')
params.append('north_south', 'off')
params.append('scotland_england', 'off')
params.append('all', 'off')

params.append('starthour', 0)
params.append('startminute', 0)
params.append('startday', prev.date())
params.append('startmonth', prev.month())
params.append('startyear', 2019)

params.append('endhour', now.hour())
params.append('endminute', 0)
params.append('endday', now.date())
params.append('endmonth', now.month())
params.append('endyear', 2019)

const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/73.0.3683.86 Chrome/73.0.3683.86 Safari/537.36'

const transform = data => {
    return _(data)
        .groupBy(row => row[' timestamp'].slice(0, 11).trim())
        .mapValues( arr => {

            return arr.map( row => Number(row[' coal']) ).reduce(sum, 0) /
                arr.map( addUp ).reduce(sum, 0)

        } )
        .toPairs()
        
        .valueOf()
}

const update = (data2019, newData) => {
    return [ ...data2019.filter( t => newData.map( t => t[0] ).indexOf( t[0] ) < 0), ...newData ]
}

const daysAndHours = n => {

    const d = Math.floor(n/24)
    const h = Math.floor((n % 24))

    if(d === 0 && h === 0) { return 'less than one hour' }

    const dayStr = d === 1 ? '1 day' : `${d} days`
    const hourStr = h === 1 ? '1 hour' : `${h} hours`

    return h === 0 ? dayStr : `${dayStr} and ${hourStr}`

}

fetch("https://gridwatch.templar.co.uk/do_download.php", {
    method : 'POST',
    "headers":{
        "Connection":"keep-alive",
        "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language":"en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control":"no-cache",
        "Content-Type":"application/x-www-form-urlencoded",
        "Pragma":"no-cache",
        "User-Agent": ua,
        "Upgrade-Insecure-Requests":"1",
        "Referer":"https://gridwatch.templar.co.uk/download.php",
    },
    "body": params.toString()
}).then( resp => resp.text())
.then( str => {

    const data = sync(str, { columns : true })

    const lastRow = data.slice(-1)[0]
    const last = moment(lastRow[' timestamp'])
    const lastBurning = data.slice().reverse().findIndex( row => Number(row[' coal'])  > 0)
    
    if(lastBurning > -1) {

        const newClean = data.slice(lastBurning).find( row => Number(row[' coal']) === 0)

        if(newClean) {

            prevLastCoal = newClean

            fs.writeFileSync('./src/server/last_coal', moment.format(newClean, 'YYYY-MM-DD HH:mm:ss'))
        }

        else {
            prevLastCoal = 'burning'
            fs.writeFileSync('./src/server/last_coal', 'burning')
        }

    }

    let runLength = prevLastCoal === 'burning' ? 0 : moment.duration(last.diff(moment(prevLastCoal, 'YYYY-MM-DD HH:mm:ss'))).asHours()

    console.log('RUn:', daysAndHours(runLength))
    fs.writeFileSync('./src/server/coal_run', daysAndHours(runLength))

    // Write out percentage

    const lastPerc = Number(lastRow[' coal'])/ addUp( lastRow )
    fs.writeFileSync('./src/server/last_percent', String(lastPerc))

    const combined = [ ...dataHist, update(data2019, transform(data)) ]


    fs.writeFileSync('./src/server/days_combined.json', JSON.stringify(combined))

    fs.writeFileSync('./src/server/last_updated', moment().format('h:mma on D MMMM'))

} )