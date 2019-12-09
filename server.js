const fs = require('fs');
const index = require('./index.js');
const config = require('../secrets.js');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const express = require('express');
// const timestamp = require('unix-timestamp');
// const bodyParser = require('body-parser');
const request = require('request');
// const app = express();

require('es6-promise').polyfill();
require('isomorphic-fetch');

let s = 10,
		m = 13,
		h = 20, //+10 to get MEL time 6AM = 20
		dd = '*',
		mm = '*',
		dow = '*';

let ATRange = [5, 9, 15];
let breed = "s/chow/"; //needs to start with s/ to account for different endpoints

feedbackLoop = {
	AT: [34],
	condition: ['hot af'],
	verdict: [],
	recordTemp: function(AT, condition) {
		feedbackLoop.AT.push(AT);
		feedbackLoop.condition.push(condition);
	}
};

const GO = schedule.scheduleJob(`${s} ${m} ${h} ${dd} ${mm} ${dow}`, function() {
	prepEmail();
});

function prepEmail() {
	let HTMLText = '<!DOCTYPE html><html><head><style>table, th, td {border: 1px solid black;border-collapse: collapse;}th, td {padding: 5px;text-align: center;} .center {display:block; margin-left:auto; margin-right:auto}</style></head><body>';
	let urlNewsBusiness = `https://newsapi.org/v2/top-headlines?country=au&category=business&apiKey=${config.apiKeyNews}`;
	let urlWeather = `http://api.openweathermap.org/data/2.5/weather?q=Melbourne&units=metric&appid=${config.apiKeyWeather}`;
	//let urlPuppies = `https://random.dog/woof.json`; dropped it due to so many failed calls
	let urlDogs = `https://dog.ceo/api/breed` + breed + `images/random`;

	fetch(urlWeather)
		.then(response => response.json())
		.then(body => new Promise(function(resolve, reject) {
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
			let clothingText;
			let condition;
			let T = body.main.temp;
			let v = body.wind.speed;
			let R = body.main.humidity;
			//SRText = functionStore.convertTimestamp(body.sys.sunrise, 'hour');
			firstLightText = functionStore.convertTimestamp(body.sys.sunrise-20*60, 'hour');
			//SSText = functionStore.convertTimestamp(body.sys.sunset, 'hour');
			e = R/100*6.105*Math.exp((17.27*T/(237.7+T)));
			let AT = T+0.33*e-0.7*v/3.6-4;

			if(body.weather[0].description.includes('rain')) {
				if(AT < ATRange[0]) {
					clothingText = clothing.rain[0].freezing;
					condition = 'freezing';
				}
			 else if(AT < ATRange[1] && AT > ATRange[0]) {
				clothingText = clothing.rain[1].cold;
				condition = 'cold';
			} else if(AT < ATRange[2] && AT > ATRange[1]) {
				clothingText = clothing.rain[2].mild;
				condition = 'mild';
			} else {
				clothingText = clothing.rain[3].hot;
				condition = 'hot';
			}} else {
				if(AT < ATRange[0]) {
					clothingText = clothing.dry[0].freezing;
					condition = 'freezing';
				}
			 else if(AT < ATRange[1] && AT > ATRange[0]) {
				clothingText = clothing.dry[1].cold;
				condition = 'cold';
			} else if(AT < ATRange[2] && AT > ATRange[1]) {
				clothingText = clothing.dry[2].mild;
				condition = 'mild';
			} else {
				clothingText = clothing.dry[3].hot;
				condition = 'hot';
			}}

			feedbackLoop.recordTemp(AT, condition);
			console.log('method check AT', feedbackLoop.AT);
			console.log('method check condition', feedbackLoop.condition);

			AT = AT.toFixed(1);
			let weatherText = `<table style="width:100%"><tr><th>Conditions</th><th>Temperature</th> <th>Humidity</th><th>Wind speed</th><th>Apparent temperature</th></tr><tr><td><a href="http://www.bom.gov.au/products/IDR024.loop.shtml">${body.weather[0].description}</a></td><td>${T} degrees</td> <td>${R} %</td><td>${v} km/hr</td><td>${AT} degrees</td></tr></table>`;
			HTMLText = HTMLText + '<h2> First Light at ' + firstLightText + ' - ' + clothingText + ' </h2>';
			HTMLText = HTMLText + '<br />' + weatherText + '<br />';
		}))

	fetch(urlDogs)
		.then(response => response.json())
		.then(body => new Promise(function(resolve, reject) {
			console.log(urlDogs);
			console.log(body.message);
			HTMLText = HTMLText + `<img src="${body.message}" class="center" width="50%">  </img> <br />`;
		}))

	fetch(urlNewsBusiness)
	  .then(response => response.json())
	  .then(body => new Promise(function(resolve, reject) {
			HTMLText = HTMLText + '<h2> New articles </h2> <br />';
	    body.articles.forEach(function(stories) {
	      if(stories.source.id == 'australian-financial-review' ||
	        stories.source.name == 'Businessinsider.com.au' ||
	        stories.source.name == 'Theaustralian.com.au') {
	          HTMLText = HTMLText + '<a href = ' + stories.url + '>' + stories.title + '</a>' +
	            '<br />' + '<i>' + stories.source.name + '</i>' +
	            '<br />' + stories.description + '<br /><br />';
	        }})
	      resolve(HTMLText);}))
	  .then(HTMLText => new Promise(function(resolve, reject) {
				const currentDate = new Date();
				dateText = functionStore.convertTimestamp(currentDate/1000, 'day');
	      let mailOptions = {
	      from: 'timjstesting@gmail.com',
	      to: 'timothy.maltby@gmail.com',
				//cc: 'kashad49@gmail.com',
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
	    }));
		};
prepEmail();
