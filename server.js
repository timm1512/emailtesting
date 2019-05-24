const fs = require('fs');
const index = require('./index.js');
const config = require('../secrets.js');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
// const express = require('express');
// const timestamp = require('unix-timestamp');
// const bodyParser = require('body-parser');
// const request = require('request');
// const app = express();

require('es6-promise').polyfill();
require('isomorphic-fetch');

const GO = schedule.scheduleJob('10 * * * * *', function() {
//const GO = () => {
	let HTMLText = '<!DOCTYPE html><html><head><style>table, th, td {border: 1px solid black;border-collapse: collapse;}th, td {padding: 5px;text-align: center;}</style></head><body>';
	let urlNewsBusiness = `https://newsapi.org/v2/top-headlines?country=au&category=business&apiKey=${config.apiKeyNews}`;
	let urlWeather = `http://api.openweathermap.org/data/2.5/weather?q=Melbourne&units=metric&appid=${config.apiKeyWeather}`;
	HTMLText = HTMLText + '<h2> Cycling weather </h2>';

	fetch(urlWeather)
		.then(response => response.json())
		.then(body => new Promise(function(resolve, reject) {
			let T = body.main.temp;
			let v = body.wind.speed;
			let R = body.main.humidity;
			e = R/100*6.105*Math.exp((17.27*T/(237.7+T)));
			let AT = T+0.33*e-0.7*v/3.6-4;

			T = T.toFixed(1);
			AT = AT.toFixed(1);
			let weatherText = `<table style="width:100%"><tr><th>Conditions</th><th>Temperature</th> <th>Humidity</th><th>Wind speed</th><th>Apparent temperature</th></tr><tr><td><a href="http://www.bom.gov.au/products/IDR024.loop.shtml">${body.weather[0].description}</a></td><td>${T} degrees</td> <td>${R} %</td><td>${v} km/hr</td><td>${AT} degrees</td></tr></table>`;
			HTMLText = HTMLText + '<br />' + weatherText + '<br />';
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
				dateText = functionStore.convertTimestamp(currentDate/1000);
	      let mailOptions = {
	      from: 'timjstesting@gmail.com',
	      to: 'timothy.maltby@gmail.com',
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
});
//};

//GO();