import * as d3se from 'd3-selection'
import * as d3a from 'd3-array'
import * as d3sh from 'd3-shape'
import * as d3sc from 'd3-scale'

const d3 = Object.assign({}, d3a, d3sc, d3se, d3sh)

import { $, $$, hashPattern, sum, duplicate } from './util'
import days from '../server/days_combined.json'
import chroma from 'chroma-js'
import euGeneration from '../server/eu_generation.json'
import palette from './palette'
import ts from '../server/last_updated'

const isMobile = window.matchMedia('(max-width: 739px)').matches
const isTablet = window.matchMedia('(max-width: 979px)').matches


const drawStripes = () => {

    const targetEl = $('#interactive-slot-1')

    targetEl.innerHTML = `
    
    <h2 class='coal-title'>Britain is rapidly phasing out coal</h2>

    <p class='coal-sub'>Daily share of Britain's power generated by burning coal</p>

    <svg class='coal-svg'></svg>
    <p class='coal-lu'>Source: Gridwatch. Last updated at ${ts}</p>`

    const svgEl = $('.coal-svg')

    const width = svgEl.getBoundingClientRect().width
    const height = isMobile ? 50 : 75


    const kbw = (240 - 32)/100
    const kbh = 5

    const keyMargin = kbh + 30

    const svg = d3.select(svgEl)
        .attr('width', width)
        .attr('height', height * 8 + 8*5 + keyMargin )

    const greyScale = chroma.scale().domain([0, 0.5])

    const green = palette.greenMain

    const cScale = v => {
        return v === 0 ? green : greyScale(v)
    }

    const keyG = svg
        .append('g')
        .attr('class', 'coal-key')
        .attr('transform', 'translate(0, 0)')



    keyG
        .append('rect')
        .attr('width', 32)
        .attr('height', kbh)
        .attr('x', 0)
        .attr('y', 0)
        .style( 'fill', green )

    keyG
        .selectAll('blah')
        .data(d3.range(0.01, 0.51, 0.005) )
        .enter()
        .append('rect')
        .attr('width', kbw)
        .attr('height', kbh)
        .attr('x', (d, i) => 32 + i*kbw)
        .attr('y', 0)
        .style('fill', cScale)
        .attr('class', 'coal-key__rect')

    keyG
        .append('text')
        .text('0%')
        .attr('class', 'coal-key__label coal-key__label--zero')
        .attr('x', 16)
        .attr('y', kbh + 17)

    keyG
        .selectAll('blah')
        .data([ 10, 20, 30, 40, 50 ])
        .enter()
        .append('text')
        .text( d => d === 50 ? '>50%' : d )
        .attr('class', 'coal-key__label')
        .attr('x', d => 32 + kbw*2*d)
        .attr('y', kbh + 17)


    const gs = svg
        .selectAll('blah')
        .data(days)
        .enter()
        .append('g')

        .attr('transform', (d, i) => `translate(0, ${keyMargin + i*(height + 5) })` )

    gs
        .each( function(arr, i) {

            const el = d3.select(this)

            const barWidth = i === 7 ? width/365 : width/arr.length

            el

            .selectAll('blah')
            .data( arr => arr )
            .enter()
            .append('rect')
            .attr('x', (d, i) => i*barWidth)
            .attr('y', 0)
            .attr('height', height)
            .attr('width', barWidth + 0.5)
            .style('fill', d => cScale(d[1]))

            el.append('text')
            .attr('x', 5)
            .attr('y', 19)
            .text( [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019][i] )

            .attr('class', 'coal-label')
            .style('fill', i <= 3 ? 'white' : '')
            

        })

}

const drawCarto = () => {

    const targetEl = $('#interactive-slot-2')

    targetEl.innerHTML = `
    
    <h2 class='coal-carto-title'>Across the EU, renewables are on the rise</h2>

    <p class='coal-carto-sub'>Power generation by source (2000-2018)</p>

    <div class='coal-carto-key'>

        <div class='coal-carto-key__block'><span class='coal-carto-r coal-carto-r--coal'></span>coal</div>
        <div class='coal-carto-key__block'><span class='coal-carto-r coal-carto-r--fossil'></span>other fossil fuels</div>
        <div class='coal-carto-key__block'><span class='coal-carto-r coal-carto-r--nuclear'></span>nuclear</div>
        <div class='coal-carto-key__block'><span class='coal-carto-r coal-carto-r--renewables'></span>renewables</div>

    </div>

    <svg class='coal-carto'></svg>

    <p class='coal-carto-source'>Source: Sandbag Climate Campaign</p>
    
    `

    const svgEl = $('.coal-carto')

    const layout = {

        UK : [ 2, 1 ],
        IE : [ 1, 1 ],
        SE : [ 4, 0 ],
        FI : [ 5, 0 ],
        EE : [ 6, 0 ],
        LV : [ 6, 1 ],
        LT : [ 6, 2 ],

        NL : [ 4, 2 ],
        DK : [ 4, 1 ],
        LU : [ 3, 3 ],
        BE : [ 3, 2 ],
        DE : [ 4, 3 ],

        FR : [ 2, 3 ],
        ES : [ 2, 4 ],
        PT : [ 1, 4 ],
        IT : [ 3, 4 ],
        AT : [ 4, 4 ],
        SI : [ 4, 5 ],
        MT : [ 3, 6 ],
        PL : [ 5, 2 ],
        CZ : [ 5, 3 ],

        SK : [ 6, 3 ],

        HU : [ 5, 4 ],
        HR : [ 5, 5 ],
        RO : [ 6, 4 ],
        BG : [ 6, 5 ],
        GR : [ 6, 6 ],
        CY : [ 8, 6 ]
    }

    let padding = 0
    const p2 = 10

    let m = Math.max(...Object.keys(layout).map( k => layout[k][0] )) + 1
    let n = Math.max(...Object.keys(layout).map( k => layout[k][1] )) + 1

    if(isMobile) {
        m = 4
        padding = 0

    }

    const width = svgEl.getBoundingClientRect().width
    const height = width/m*n

    const svg = d3.select(svgEl)
        .attr('width', width)
        .attr('height', height)

    const hash = hashPattern('coal-hash', 'coal-hash--path', 'coal-hash--rect')

    const defs = svg.append('defs').html(hash)

    const boxWidth = (width - (m-1)*padding)/m
    const boxHeight = boxWidth

    const yearRange = d3.range(2000, 2019)

    const gs = svg
        .selectAll('blah')
        .data(euGeneration)
        .enter()
        .append('g')
        .attr('transform', (d, i) => {

            if(isMobile) { 
                return `translate(${ (i % m)*(boxWidth + padding) }, ${ Math.floor(i/m)*(boxHeight + padding) })`
            }

            const e = layout[d.code]

            if(!e) { console.log(d.code) }

            return `translate(${ 0 + e[0]*(boxWidth + padding) }, ${ 0 + e[1]*(boxHeight + padding) })`
        })
        .attr('class', 'coal-carto-g')
        .attr('id', d => 'g-' + d.code )

    if(!isMobile) {

        const ire = gs.filter( d => d.country === 'Ireland' )
        ire.append('text')
            .attr('x', 0)
            .attr('y', boxHeight + 14)

            .text('2000')
            .attr('class', 'coal-carto-y')

        ire.append('text')
            .attr('x', boxWidth)
            .attr('y', boxHeight + 14)

            .text('2018')
            .attr('class', 'coal-carto-y coal-carto-y--right')

        ire.append('text')
            .attr('x', -4)
            .attr('y', boxHeight - 1)

            .text('0%')
            .attr('class', 'coal-carto-y coal-carto-y--right')

        ire.append('text')
            .attr('x', -4)
            .attr('y', 11)

            .text('100%')
            .attr('class', 'coal-carto-y coal-carto-y--right')

    } else {

        const aut = gs.filter( d => d.country === 'Austria' )

        aut
        .append('text')
        .attr('x', 0)
        .text( '2000' )
        .attr('y', -3)
        .attr('class', 'coal-carto-y')

        aut
        .append('text')
        .attr('x', boxWidth)
        .text( '2018' )
        .attr('y', -3)
        .attr('class', 'coal-carto-y coal-carto-y--right')


    }

    const xScale = d3.scaleLinear()
        .domain([ 0, 19 ])
        .range([ 0, boxWidth ])

    const yScale = d3.scaleLinear()
        .domain([ 0, 100 ])
        .range([ boxHeight, 0 ])

    const area = d3.area()
        .x((d, i) => i*boxWidth/17)
        .y0( d => yScale(d[0]) )
        .y1( d => yScale(d[1]) )

    const line = d3.area()
        .x((d, i) => i*boxWidth/17)
        .y( d => yScale(d[1]) )

    const areas = gs
        .selectAll('blah')
        .data( o => {
            const arr = o.data.filter(o => ['Coal', 'Other fossil fuels', 'Nuclear', 'All renewables'].indexOf(o.source) >= 0)
                .sort((a, b) => {

                    const order = ['Coal', 'Other fossil fuels', 'Nuclear', 'All renewables']
                    return order.indexOf(a.source) - order.indexOf(b.source)

                })

            const out = arr.map((o, i) => {
                const sliced = arr.slice(0, i)
                const prev = o.data.map( (v, j) => sliced.map( o2 => o2.data[j] ).reduce(sum, 0) )
                const cumu = o.data.map( (v, j) => v + sliced.map( o2 => o2.data[j] ).reduce(sum, 0) )
                return { source : o.source, data : prev.map( (o, i) => [ o, cumu[i] ]) }
            })
            return out

        })
        .enter()
        .append('path')

        .attr('d', d => area(d.data))

        .attr('class', 'coal-carto-area')

        .style('fill', d => {

            return {
                'Coal' : '#121212',
                'Other fossil fuels' : '#767676',
                'Nuclear' : '#dcdcdc',
                'All renewables' : palette.greenMain
            }[d.source]

        })

    const lines = gs
        .selectAll('blah')
        .data( o => {
            const arr = o.data.filter(o => ['Coal', 'Other fossil fuels', 'Nuclear', 'All renewables'].indexOf(o.source) >= 0)
                .sort((a, b) => {

                    const order = ['Coal', 'Other fossil fuels', 'Nuclear', 'All renewables']
                    return order.indexOf(a.source) - order.indexOf(b.source)

                })

            const out = arr.map((o, i) => {
                const sliced = arr.slice(0, i)
                const prev = o.data.map( (v, j) => sliced.map( o2 => o2.data[j] ).reduce(sum, 0) )
                const cumu = o.data.map( (v, j) => v + sliced.map( o2 => o2.data[j] ).reduce(sum, 0) )
                return { source : o.source, data : prev.map( (o, i) => [ o, cumu[i] ]) }
            })
            return out

        })
        .enter()
        .append('path')

        .attr('d', d => line(d.data))

        .attr('class', 'coal-carto-line')

        const boxes = gs
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', boxWidth )
        .attr('height', boxHeight)
        .attr('class', d => d.code === 'UK' ? 'coal-carto-box coal-carto-box--uk' : 'coal-carto-box')

        gs
            .append('text')
            .attr('x', boxWidth/2 )
            .attr('y', boxHeight - 7)
            .attr('class', 'coal-country-label')
            .text( d => isMobile || isTablet ? d.country.replace('Republic', 'Rep.' ) : d.country )

        //     if(['Coal'].indexOf(d.source) < 0) {
        //         return ''
        //     }

        //     return {
        //         Coal : '#121212',
        //         'Other fossil fuels' : '#dcdcdc',
        //         'Nuclear' : '#dcdcdc',
        //         'All renewables' : palette.greenMain
        //     }[d.source]

        // })

        $$('.coal-country-label').forEach( el => duplicate(el, 'coal-country-label--white') )

    // const coalRectOld = gs
    //     .append('rect')
    //     .attr('x', 0)
    //     .attr('y', 0)

    //     .each(function(d, i) {

    //         const el = d3.select(this)
    //         const coal = d.data.find( o => o.source === 'Coal' )

    //         const a = boxWidth*Math.sqrt(coal.data[0]/100)

    //         el
    //             .attr('width', a)
    //             .attr('height', a)
    //             .attr('class', 'coal-carto-y coal-carto-y--old')

    //     })

    // const coalRectNew = gs
    //     .append('rect')
    //     .attr('x', 0)
    //     .attr('y', 0)

    //     .each(function(d, i) {

    //         const el = d3.select(this)
    //         const coal = d.data.find( o => o.source === 'Coal' )

    //         const a = boxWidth*Math.sqrt(coal.data.slice(-1)[0]/100)

    //         el
    //             .attr('width', a)
    //             .attr('height', a)
    //             .attr('class', 'coal-carto-y coal-carto-y--new')

    //     })

    // const bars = gs
    //     .selectAll('blah')
    //     .data( o => o.data.filter( o => ['Coal', 'Other fossil fuels', 'Nuclear', 'All renewables'].indexOf(o.source) >= 0 ))
    //     .enter()
    //     .append('rect')

    //     .attr('width', boxWidth)
    //     .attr('x', 0)
    //     .each( function(d, i, nodes) {

    //         const el = d3.select(this)

    //         const arr = nodes.map( n => n.__data__ )

    //         const cumu = arr.slice(0, i).map( o => o.data.slice(-1)[0]).reduce(sum, 0)
    //         const v = d.data.slice(-1)[0]

    //         console.log(d.source, cumu, v)

    //         el
    //             .attr('y', yScale(cumu) )
    //             .attr('height', yScale(v))


    //     } )
    //     // .attr('x2', boxWidth)
    //     // .attr('y1', d => yScale(d.data[0]) )
    //     // .attr('y2', d => yScale(d.data.slice(-1)[0]) )
    //     // .attr('class', 'coal-carto-line')

    //     .style('fill', d => {

    //         if(['Coal', 'Other fossil fuels', 'Nuclear', 'All renewables'].indexOf(d.source) < 0) {
    //             return ''
    //         }

    //         return {
    //             Coal : 'black',
    //             'Other fossil fuels' : palette.newsRed,
    //             'Nuclear' : palette.orange,
    //             'All renewables' : palette.greenMain
    //         }[d.source]

    //     })

}

drawStripes()

drawCarto()