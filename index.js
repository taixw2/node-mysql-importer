'use strict'

const mysql = require('mysql')
const fs = require('fs-promise')
const Validator = require('jsonschema').Validator
const v = new Validator()
var conn



const configSchema = {
	'host': {'type': 'string'},
	'user': {'type': 'string'},
	'password': {'type': 'string'},
	'database': {'type': 'string'}
}

exports.config = data => {
	return new Promise( (resolve, reject) => {
		
		
		const valid = v.validate(data, configSchema)
		
		if (valid) {
			
			conn = data
			
			resolve(true)
		} else {
			reject('invalid config data')
		}
	})
}

exports.importSQL = filename => {
	
	return new Promise( (resolve, reject) => {
		
		fs.readFile(filename, 'utf8').then(arraySplit).then(runQueries).then( () => {
			
			resolve('all tables created')
		}).catch( err => {
			
			
			reject(`error: ${err}`)
		})
	})
}

function arraySplit(str) {
	
	return new Promise( (resolve, reject) => {
		if (str.indexOf(';') === -1) {
			reject('each SQL statement must terminate with a semicolon (;)')
		}
		str = str.trim()
		str = str.replace(/(?:\r\n|\r|\n)/g, ' ')
		str = str.replace(/\s\s+/g, ' ').trim()
		str = str.replace(/\/\*(?:.|[\r\n])*?\*\//g, ' ').trim()
		str = str.substring(0, str.length-1)
		let arr = str.split(';').map(v => {
			return v.replace(/--.*-+/g, ' ').trim()
		})
		resolve(arr)
	})
}


function runNext(arr, db, done) {

	if (!arr.length) {
		done()
		return
	}
	db.query(arr.shift(), (err, rows) => {
		if (err) {
			throw 'ERROR' + err
		} 
		console.log(arr)
		runNext(arr, db, done)
	})
}

function runQueries(arr) {

	if (!arr.length) return
	
	let db = mysql.createConnection(conn)

	return new Promise(resolve => {

		runNext(arr, db, () => {
			console.log('DONE!!!')
			db.end()
			resolve()
		})

	})
}
