//////////////////
//DON'T DECLARE GLOBAL FUNCTIONS
//jstesting1512
/////////////////

const fs = require('fs');
const express = require('express');
const timestamp = require('unix-timestamp');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const request = require('request');
const schedule = require('node-schedule');
const app = express();
//var server = require('./server');
const config = require('../secrets.js');
require('es6-promise').polyfill();
require('isomorphic-fetch');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended:true }));
app.set('view engine','ejs')

////////////////////////////////////////
//GENERAL DEFINITIONS//////////
///////////////////////////////////////

let urlWeather = `http://api.openweathermap.org/data/2.5/weather?q=Melbourne,au&units=metric&appid=${config.apiKeyWeather}`;
let urlDogs = `https://random.dog/woof.json`;
let urlAdvice = `https://api.adviceslip.com/advice`;
let output = [];

let s = 10,
		m = 13,
		h = 20, //+10 to get MEL time 6AM = 20 in AEDT
		dd = '*',
		mm = '*',
		dow = '*';

let ATRange = [5, 9, 15];

let clothing = {
	"rain": [
	{"freezing": "Jumper, breaker, thermal and gloves"},
	{"cold": "Jumper, breaker and gloves"},
	{"mild": "Breaker only"},
	{"hot": "hot af"}
	],
	"dry": [
		{"freezing": "Jumper, breaker, thermal and gloves"},
		{"cold": "Jumper, breaker and gloves"},
		{"mild": "Jumper only"},
		{"hot": "hot af"}
	]};

	////////////////////////////////////////
	//ACTUAL FUNCTION//////////
	///////////////////////////////////////

const GO = schedule.scheduleJob(`${s} ${m} ${h} ${dd} ${mm} ${dow}`, function() {
//GO();
//function GO() {
	getData().then(result => {
		console.log(output);

		if(output[5].includes('rain')) {
			if(output[4] < ATRange[0]) {
				clothingText = clothing.rain[0].freezing;
				condition = 'freezing';
			}
		 else if(output[4] < ATRange[1] && output[4] > ATRange[0]) {
			clothingText = clothing.rain[1].cold;
			condition = 'cold';
		} else if(output[4] < ATRange[2] && output[4] > ATRange[1]) {
			clothingText = clothing.rain[2].mild;
			condition = 'mild';
		} else {
			clothingText = clothing.rain[3].hot;
			condition = 'hot';
		}} else {
			if(output[4] < ATRange[0]) {
				clothingText = clothing.dry[0].freezing;
				condition = 'freezing';
			}
		 else if(output[4] < ATRange[1] && output[4] > ATRange[0]) {
			clothingText = clothing.dry[1].cold;
			condition = 'cold';
		} else if(output[4] < ATRange[2] && output[4] > ATRange[1]) {
			clothingText = clothing.dry[2].mild;
			condition = 'mild';
		} else {
			clothingText = clothing.dry[3].hot;
			condition = 'hot';
		}}

		let HTMLText = '<!DOCTYPE html><html><head><style>table, th, td {border: 1px solid black;border-collapse: collapse;}th, td {padding: 5px;text-align: center;} .center {display:block; margin-left:auto; margin-right:auto}</style></head><body>';
		let weatherText = `<table style="width:100%"><tr><th>Conditions</th><th>Temperature</th> <th>Humidity</th><th>Wind speed</th><th>Apparent temperature</th></tr><tr><td><a href="http://www.bom.gov.au/products/IDR024.loop.shtml">${output[5]}</a></td><td>${output[0]} degrees</td> <td>${output[2]} %</td><td>${output[1]} km/hr</td><td>${output[4]} degrees</td></tr></table>`;
		HTMLText = HTMLText + '<h2> First Light at ' + output[3] + ' - ' + clothingText + ' </h2>';
		HTMLText = HTMLText + '<h2> Advice bot says: ' + output[6] + ' </h2>';
		HTMLText = HTMLText + '<br />' + weatherText + '<br />';
		HTMLText = HTMLText + `<img src="${output[7]}" class="center" width="50%">  </img> <br />`;

		const currentDate = new Date();
		dateText = functionStore.convertTimestamp(currentDate/1000, 'day');
		let mailOptions = {
		from: 'timjstesting@gmail.com',
		to: 'timothy.maltby@gmail.com',
		cc: 'kashad49@gmail.com',
		subject: `Update for ${dateText}`,
		html: HTMLText +'</body></html>'
		};
		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: 'timjstesting@gmail.com',
				pass: config.emailPassword
			}
		});
		transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
		})
	});
});
    
async function getData() {
	//WEATHER
	const responseWeather = await fetch(urlWeather);
	const JSONWeather = await responseWeather.json();

	let T = JSONWeather.main.temp;
	let v = JSONWeather.wind.speed;
	let R = JSONWeather.main.humidity;
	let precip = JSONWeather.weather[0].description;
	firstLightText = functionStore.convertTimestamp(JSONWeather.sys.sunrise-19*60, 'hour');
	e = R/100*6.105*Math.exp((17.27*T/(237.7+T)));
	let AT = T+0.33*e-0.7*v/3.6-4;
	output = [T, v, R, firstLightText, AT, precip];

	//ADVICE
	const responseAdvice = await fetch(urlAdvice);
	const JSONAdvice = await responseAdvice.json();
	adviceString = JSONAdvice.slip.advice;
	output.push(adviceString);

	//SOLAR


	//PUPPIES
	let dogURL = [];
	const responseDogs = await fetch(urlDogs);
	const JSONDogs = await responseDogs.json();
	if(JSONDogs.url.includes('mp4')) { } else {
		dogURL.push(JSONDogs.url);}
	const responseDogs2 = await fetch(urlDogs);
	const JSONDogs2 = await responseDogs2.json();
	if(JSONDogs2.url.includes('mp4')) { } else {
		dogURL.push(JSONDogs2.url);}
	const responseDogs3 = await fetch(urlDogs);
	const JSONDogs3 = await responseDogs3.json();
	if(JSONDogs3.url.includes('mp4')) { } else {
		dogURL.push(JSONDogs3.url);}

	output.push(dogURL[0]);
}

////////////////////////////////////////////////////
//ADDITIONAL REQUIRED FUNCTIONS
///////////////////////////////////////////////////

functionStore = {
	getTodayDate : function getTodayDate() {
		var d = Date.now()/1000,

		yyyy = d.getFullYear(),
		mm = ('0' + (d.getMonth() + 1)).slice(-2),
		dd = ('0' + d.getDate()).slice(-2),  

		today = [dd, mm, yyyy];
		dateString = `${today[2]}-${today[1]}-${today[0]}`;
		return datesString;
	},

	convertTimestamp : function convertTimestamp(timestamp, format) {
	  var d = new Date((timestamp + 86400) * 1000),	// Add one day, Convert the passed timestamp to milliseconds
			yyyy = d.getFullYear(),
			mm = ('0' + (d.getMonth() + 1)).slice(-2),	// Months are zero based. Add leading 0.
			dd = ('0' + d.getDate()).slice(-2),			// Add leading 0.
			hh = d.getHours(),
			h = hh,
			min = ('0' + d.getMinutes()).slice(-2),		// Add leading 0.
			ampm = 'AM',
			time;

		if (hh > 12) {
			h = hh - 12;
			ampm = 'PM';
		} else if (hh === 12) {
			h = 12;
			ampm = 'PM';
		} else if (hh == 0) {
			h = 12;
		}

		// ie: 2013-02-18, 8:35 AM
		if(format == 'day') {
			time = dd + '-' + mm + '-' + yyyy; // + ', ' + h + ':' + min + ' ' + ampm;
		} else {
			time = h + ':' + min + ' ' + ampm;
		}
		return time;
	},

	arrayRemove: function arrayRemove(array, value) {
		return array.filter(function(element){
			return element != value;
		})
	}
}
