import templateHTML from "./src/templates/main.html!text"
import moment from 'moment'
import fs from 'fs'

const round = (value, exp) => {
	if (typeof exp === 'undefined' || +exp === 0)
		return Math.round(value);

	value = +value;
	exp = +exp;

	if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
		return NaN;

	value = value.toString().split('e');
	value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

	value = value.toString().split('e');
	return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

export async function render() {
    // this function just has to return a string of HTML
    // you can generate this using js, e.g. using Mustache.js

    const ts = fs.readFileSync('./src/server/last_updated', 'utf-8')
    const coalStr = fs.readFileSync('./src/server/coal_run', 'utf-8')
    const perc = Number(fs.readFileSync('./src/server/last_percent', 'utf-8'))

    const curSent1 = perc === 0  ? `Coal is currently generating <strong class='coal-green'>0% of Britain's power</strong>.`
    : `Coal is currently generating <strong class='coal-black'>${round(perc*100, perc*100 < 0.005 ? 3 : 2)}% of Britain's power</strong>.`

    const curSent2 = perc === 0 ? `The coal-free run has lasted <strong class='coal-green'>${coalStr}</strong> so far.` : ''

    return `
    <h1 class='coal-run'>${curSent1} ${curSent2}</h1>
    <p class='coal-lu'>Source: Gridwatch. Last updated at ${ts}</p>
    `
}