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
const server = require('./server.js');
const config = require('../secrets.js');

functionStore = {
	FXParse : function FXParse(pair) {
		let url = `https://forex.1forge.com/1.0.3/quotes?pairs=${pair}&api_key=${apiKeyForex}`;
		request(url, function (err, response, bodyRate) {
			let rate = JSON.parse(bodyRate);
			rateText = `${rate[0].symbol} : ${(rate[0].price.toFixed(3))*100}`;
		})
		return rateText;
	},

	NASAParse : function NASAParse() {
		var imageNASA = {URL: ["Initialise"], caption: ["Initialise"], title: ["Initialise"]};
		let url = `https://api.nasa.gov/planetary/apod?api_key=${apiKeyNASA}`;
		request(url, function (err, response, body) {
			let image = JSON.parse(body);
			if(err) {
				console.log('FAILED');
			} else {
				imageNASA.URL = image.url;
				imageNASA.caption = image.explanation;
				imageNASA.title = image.title;
				return imageNASA;
			}
		})
		console.log('End Function:', imageNASA);
	},

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
	  var d = new Date(timestamp * 1000),	// Convert the passed timestamp to milliseconds
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
	}
}

// app.listen(8080, function () {
//   console.log('Page started')
// })

// const transporter = nodemailer.createTransport({
// 	service: 'gmail',
// 	auth: {
// 		user: 'timjstesting@gmail.com',
// 		pass: config.emailPassword
// 	}
// });

var rateText = ["Initialise"];
var asteroidDayArray = ["Initialise"];
var asteroidDistanceArray = ["Initialise"];
var asteroidSpeedArray = ["Initialise"];
var imageNASA = {title: ["Initialise"], URL: ["Initialise"], caption: ["Initialise"]};
var today = ["day", "month", "year"];
var launchArray = {number: ["Initialise"], date: ["Initialise"], rocket: ["Initialise"]};
var newsData = {'business': ["ARTICLES"], 'world': ["ARTICLES"], 'tech': ["ARTICLES"]};

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended:true }));
app.set('view engine','ejs')

app.get('/', function (req, res) {
	let pair = `AUDUSD`;
	//Parse NASA
	// let urlNASA = `https://api.nasa.gov/planetary/apod?api_key=${apiKeyNASA}`;
	// request(urlNASA, function (err, response, body) {
	// 	let image = JSON.parse(body);
	// 	if(err) {
	// 		console.log('FAILED');
	// 	} else {
	// 		imageNASA.URL = image.url;
	// 		imageNASA.caption = image.explanation;
	// 		imageNASA.title = image.title;
	// 		return imageNASA;
	// 	}
	// })
	console.log(imageNASA);
	//ParseFX
	let urlFX = `https://forex.1forge.com/1.0.3/quotes?pairs=${pair}&api_key=${config.apiKeyForex}`;
	request(urlFX, function (err, response, bodyRate) {
		let rate = JSON.parse(bodyRate);
		rateText = `${rate[0].symbol} : ${(rate[0].price.toFixed(3))*100}`;
	})
	res.render('index', {ImageNASA: imageNASA, FX: rateText, weather: null, error: null});
})


app.post('/spacex', function (req, res) {
	let url=`https://api.spacexdata.com/v3/launches/upcoming`;
	request(url, function (err, response, body) {
		if(err){
			console.log('Failed at request');
		}  else {
			let launch = JSON.parse(body);
				for (i=0; i<launch.length; i++) {
					launchArray.number[i] = `Flight ${launch[i].flight_number}`;
					launchArray.date[i] = `${launch[i].launch_date_utc.substring(0,10)}`;
					launchArray.rocket[i] = `${launch[i].rocket.rocket_name}`;
				}
		}
	})
	res.render('spacex', {LaunchArray: launchArray});
})



app.post('/asteroid', function (req, res) {
	let url = `https://ssd-api.jpl.nasa.gov/cad.api`;
	request(url, function (err, response, body) {
		if(err){
			console.log('Failed at request');
		} else {
					let asteroidData = JSON.parse(body);
					if(asteroidData == undefined){
						console.log('Failed at call to NASA API');
		} else {
				  let dayAsteroids = asteroidData.data;
					for(i=0; i<dayAsteroids.length; i++) {
						asteroidDayArray[i] = dayAsteroids[i][3]; //approach date
						asteroidDistanceArray[i] = Math.floor(dayAsteroids[i][5]*150000000); //distance in km (from au)
						asteroidSpeedArray[i] = Math.floor(dayAsteroids[i][7]); //speed in km/s
					}
		}
	}
	var mailOptions = {
		from: 'timjstesting@gmail.com',
		to: 'timothy.maltby@gmail.com',
		subject: 'Test',
		text: 'Test success'
	};
// 	transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });
	res.render('asteroid', {asteroidDay: asteroidDayArray, asteroidDistance: asteroidDistanceArray, asteroidSpeed: asteroidSpeedArray});
});
})

app.post('/', function (req, res) {
	let city = req.body.city;
	console.log('Received from call:', city);
 	let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${config.apiKeyWeather}`;
	request(url, function (err, response, body) {
		if(err){
			res.render('index', {weather:null, error:'Failed at request'});
		} else {
     			let weather = JSON.parse(body);
      		if(weather.main == undefined){
        		res.render('index', {weather: null, error: 'Failed at call to API'});
      		} else {
			let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}`;
			res.render('index', {ImageNASA: imageNASA, weather: weatherText, FX: rateText, error: null});
      		}
    	}
  });
})
